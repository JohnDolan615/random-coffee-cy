import { Context, InlineKeyboard } from "grammy";
import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import type { OnboardingState } from "@random-coffee/shared";

const onboardingStates = new Map<number, OnboardingState>();

const PROFESSION_OPTIONS = [
  "Software Engineer", "Product Manager", "Designer", "Data Scientist",
  "Marketing Manager", "Sales Manager", "Consultant", "CEO", "CTO", "Other"
];

const INDUSTRY_OPTIONS = [
  "Technology", "Finance", "Healthcare", "Consulting", "Media", "Education",
  "E-commerce", "AI/ML", "Fintech", "Gaming", "Real Estate", "Other"
];

const TOPIC_OPTIONS = [
  "Artificial Intelligence", "Startups", "Product Strategy", "Leadership",
  "Career Growth", "Investing", "Remote Work", "Tech Trends", "Innovation",
  "Entrepreneurship", "Data Science", "Design Thinking", "Marketing",
  "Sales", "Operations", "Finance", "HR", "Legal", "Other"
];

const GOAL_OPTIONS = [
  { key: "NETWORKING", label: "General networking" },
  { key: "MENTORSHIP", label: "Find a mentor/mentee" },
  { key: "CAREER_ADVICE", label: "Career advice" },
  { key: "INDUSTRY_INSIGHTS", label: "Industry insights" },
  { key: "COLLABORATION", label: "Business collaboration" },
  { key: "FRIENDSHIP", label: "Professional friendship" }
];

const MODE_OPTIONS = [
  { key: "IN_PERSON", label: "🏢 In-person only" },
  { key: "ONLINE", label: "💻 Online only" },
  { key: "BOTH", label: "🔄 Both" }
];

export async function handleStart(ctx: Context) {
  try {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    let user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
      include: { profile: true }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId: BigInt(telegramId),
          username: ctx.from?.username,
          firstName: ctx.from?.first_name,
          lastName: ctx.from?.last_name,
          languageCode: ctx.from?.language_code,
          isPremium: ctx.from?.is_premium || false,
        },
        include: { profile: true }
      });
    }

    if (user.profile?.isOnboarded) {
      await ctx.reply("Welcome back! You're already set up. Use /profile to edit your settings or /match to find someone new to meet! ☕");
      return;
    }

    const state: OnboardingState = {
      step: 'profession',
      data: {}
    };
    
    onboardingStates.set(telegramId, state);

    await ctx.reply(
      "Welcome to Random Coffee! ☕\n\n" +
      "Let's get you set up in about 60 seconds so we can connect you with awesome people in your field.\n\n" +
      "First, what's your current profession?",
      {
        reply_markup: createProfessionKeyboard()
      }
    );

  } catch (error) {
    logger.error(error, 'Error in handleStart');
    await ctx.reply("Sorry, something went wrong. Please try again with /start");
  }
}

export async function handleOnboardingCallback(ctx: Context) {
  try {
    const telegramId = ctx.from?.id;
    if (!telegramId || !ctx.callbackQuery?.data) return;

    const state = onboardingStates.get(telegramId);
    if (!state) {
      await ctx.answerCallbackQuery("Session expired. Please start over with /start");
      return;
    }

    const data = ctx.callbackQuery.data;
    await ctx.answerCallbackQuery();

    switch (state.step) {
      case 'profession':
        await handleProfessionStep(ctx, state, data);
        break;
      case 'industries':
        await handleIndustriesStep(ctx, state, data);
        break;
      case 'topics':
        await handleTopicsStep(ctx, state, data);
        break;
      case 'goals':
        await handleGoalsStep(ctx, state, data);
        break;
      case 'mode':
        await handleModeStep(ctx, state, data);
        break;
      default:
        break;
    }

  } catch (error) {
    logger.error(error, 'Error in handleOnboardingCallback');
    await ctx.reply("Something went wrong. Please try /start again.");
  }
}

async function handleProfessionStep(ctx: Context, state: OnboardingState, data: string) {
  if (data === 'other_profession') {
    await ctx.editMessageText(
      "What's your profession? (Type your answer)",
      { reply_markup: new InlineKeyboard().text("⬅️ Back", "back_to_professions") }
    );
    state.step = 'profession';
    return;
  }

  state.data.profession = data;
  state.data.professionLevel = 'MID'; // Default
  state.step = 'industries';

  await ctx.editMessageText(
    "Great! Now select up to 2 industries you're interested in or work in:",
    { reply_markup: createIndustriesKeyboard([]) }
  );
}

async function handleIndustriesStep(ctx: Context, state: OnboardingState, data: string) {
  const selectedIndustries = state.data.industries || [];

  if (data === 'done_industries') {
    if (selectedIndustries.length === 0) {
      await ctx.answerCallbackQuery("Please select at least 1 industry");
      return;
    }
    state.step = 'topics';
    await ctx.editMessageText(
      "Perfect! Now pick 3-5 topics you'd love to discuss over coffee:",
      { reply_markup: createTopicsKeyboard([]) }
    );
    return;
  }

  if (data === 'other_industry') {
    await ctx.editMessageText("Type your industry:");
    return;
  }

  if (selectedIndustries.includes(data)) {
    state.data.industries = selectedIndustries.filter(i => i !== data);
  } else if (selectedIndustries.length < 2) {
    state.data.industries = [...selectedIndustries, data];
  } else {
    await ctx.answerCallbackQuery("You can select up to 2 industries");
    return;
  }

  await ctx.editMessageReplyMarkup({
    reply_markup: createIndustriesKeyboard(state.data.industries)
  });
}

async function handleTopicsStep(ctx: Context, state: OnboardingState, data: string) {
  const selectedTopics = state.data.topics || [];

  if (data === 'done_topics') {
    if (selectedTopics.length < 3) {
      await ctx.answerCallbackQuery("Please select at least 3 topics");
      return;
    }
    state.step = 'about';
    await ctx.editMessageText(
      "Awesome! Now write a brief 120-character intro about yourself (this helps others connect with you):"
    );
    return;
  }

  if (data === 'custom_topic') {
    await ctx.editMessageText("Type your custom topic (one at a time):");
    return;
  }

  if (selectedTopics.includes(data)) {
    state.data.topics = selectedTopics.filter(t => t !== data);
  } else if (selectedTopics.length < 5) {
    state.data.topics = [...selectedTopics, data];
  } else {
    await ctx.answerCallbackQuery("You can select up to 5 topics");
    return;
  }

  await ctx.editMessageReplyMarkup({
    reply_markup: createTopicsKeyboard(state.data.topics)
  });
}

async function handleGoalsStep(ctx: Context, state: OnboardingState, data: string) {
  const goals = state.data.goal1 ? [state.data.goal1] : [];
  if (state.data.goal2) goals.push(state.data.goal2);

  if (data === 'done_goals') {
    if (!state.data.goal1) {
      await ctx.answerCallbackQuery("Please select at least 1 goal");
      return;
    }
    state.step = 'mode';
    await ctx.editMessageText(
      "Great! How would you prefer to meet?",
      { reply_markup: createModeKeyboard() }
    );
    return;
  }

  if (goals.includes(data)) {
    if (state.data.goal1 === data) {
      state.data.goal1 = state.data.goal2;
      state.data.goal2 = undefined;
    } else {
      state.data.goal2 = undefined;
    }
  } else {
    if (!state.data.goal1) {
      state.data.goal1 = data;
    } else if (!state.data.goal2) {
      state.data.goal2 = data;
    } else {
      await ctx.answerCallbackQuery("You can select up to 2 goals");
      return;
    }
  }

  await ctx.editMessageReplyMarkup({
    reply_markup: createGoalsKeyboard(state.data.goal1, state.data.goal2)
  });
}

async function handleModeStep(ctx: Context, state: OnboardingState, data: string) {
  state.data.mode = data;
  
  if (data === 'IN_PERSON' || data === 'BOTH') {
    await ctx.editMessageText("What city are you based in? (Type city name)");
    state.step = 'city';
  } else {
    await completeOnboarding(ctx, state);
  }
}

export async function handleTextMessage(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const state = onboardingStates.get(telegramId);
  if (!state) return;

  const text = ctx.message?.text;
  if (!text) return;

  try {
    switch (state.step) {
      case 'profession':
        if (text.length > 50) {
          await ctx.reply("Please keep profession under 50 characters");
          return;
        }
        state.data.profession = text;
        state.step = 'industries';
        await ctx.reply(
          "Great! Now select up to 2 industries you're interested in:",
          { reply_markup: createIndustriesKeyboard([]) }
        );
        break;

      case 'industries':
        if (text.length > 50) {
          await ctx.reply("Please keep industry name under 50 characters");
          return;
        }
        const customIndustries = state.data.industries || [];
        if (customIndustries.length < 2) {
          state.data.industries = [...customIndustries, text];
          await ctx.reply("Industry added! Select more or tap Done:", {
            reply_markup: createIndustriesKeyboard(state.data.industries)
          });
        }
        break;

      case 'topics':
        if (text.length > 50) {
          await ctx.reply("Please keep topic under 50 characters");
          return;
        }
        const customTopics = state.data.customTopics || [];
        const allTopics = [...(state.data.topics || []), ...customTopics];
        if (allTopics.length < 5) {
          state.data.customTopics = [...customTopics, text];
          await ctx.reply("Topic added! Add more or tap Done:", {
            reply_markup: createTopicsKeyboard([...(state.data.topics || []), ...state.data.customTopics])
          });
        }
        break;

      case 'about':
        if (text.length > 120) {
          await ctx.reply("Please keep your intro under 120 characters");
          return;
        }
        state.data.about = text;
        state.step = 'goals';
        await ctx.reply(
          "Perfect! What are your main goals for coffee chats? (Pick 1-2)",
          { reply_markup: createGoalsKeyboard() }
        );
        break;

      case 'city':
        state.data.cityName = text;
        state.data.radiusKm = 25; // Default
        state.data.timezone = 'UTC'; // Will be auto-detected
        await completeOnboarding(ctx, state);
        break;
    }
  } catch (error) {
    logger.error(error, 'Error handling text message in onboarding');
    await ctx.reply("Something went wrong. Please try again.");
  }
}

async function completeOnboarding(ctx: Context, state: OnboardingState) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  try {
    // Create or update profile
    await prisma.profile.upsert({
      where: { userId: ctx.from?.id.toString() || '' },
      create: {
        userId: ctx.from?.id.toString() || '',
        profession: state.data.profession,
        professionLevel: 'MID',
        about: state.data.about,
        goal1: state.data.goal1 as any,
        goal2: state.data.goal2 as any,
        mode: state.data.mode as any,
        radiusKm: state.data.radiusKm || null,
        timezone: state.data.timezone || 'UTC',
        frequency: 'weekly',
        vibe: 'MIXED',
        isOnboarded: true,
      },
      update: {
        profession: state.data.profession,
        about: state.data.about,
        goal1: state.data.goal1 as any,
        goal2: state.data.goal2 as any,
        mode: state.data.mode as any,
        radiusKm: state.data.radiusKm || null,
        timezone: state.data.timezone || 'UTC',
        isOnboarded: true,
      }
    });

    // Clean up state
    onboardingStates.delete(telegramId);

    const keyboard = new InlineKeyboard()
      .text("☕ Find a match", "request_match").row()
      .text("👤 Edit profile", "edit_profile")
      .text("⚙️ Settings", "settings");

    await ctx.reply(
      "🎉 You're all set!\n\n" +
      "Your profile is complete and you're ready to connect with interesting people in your field.\n\n" +
      "What would you like to do next?",
      { reply_markup: keyboard }
    );

  } catch (error) {
    logger.error(error, 'Error completing onboarding');
    await ctx.reply("Something went wrong saving your profile. Please try /start again.");
  }
}

function createProfessionKeyboard() {
  const keyboard = new InlineKeyboard();
  
  PROFESSION_OPTIONS.forEach((profession, index) => {
    if (profession === 'Other') {
      keyboard.text(profession, 'other_profession');
    } else {
      keyboard.text(profession, profession);
    }
    if ((index + 1) % 2 === 0) keyboard.row();
  });
  
  return keyboard;
}

function createIndustriesKeyboard(selected: string[]) {
  const keyboard = new InlineKeyboard();
  
  INDUSTRY_OPTIONS.forEach((industry, index) => {
    const isSelected = selected.includes(industry);
    const text = isSelected ? `✅ ${industry}` : industry;
    
    if (industry === 'Other') {
      keyboard.text(text, 'other_industry');
    } else {
      keyboard.text(text, industry);
    }
    if ((index + 1) % 2 === 0) keyboard.row();
  });
  
  keyboard.row().text("✅ Done", "done_industries");
  return keyboard;
}

function createTopicsKeyboard(selected: string[]) {
  const keyboard = new InlineKeyboard();
  
  TOPIC_OPTIONS.forEach((topic, index) => {
    const isSelected = selected.includes(topic);
    const text = isSelected ? `✅ ${topic}` : topic;
    
    if (topic === 'Other') {
      keyboard.text(text, 'custom_topic');
    } else {
      keyboard.text(text, topic);
    }
    if ((index + 1) % 2 === 0) keyboard.row();
  });
  
  keyboard.row().text("✅ Done", "done_topics");
  return keyboard;
}

function createGoalsKeyboard(goal1?: string, goal2?: string) {
  const keyboard = new InlineKeyboard();
  
  GOAL_OPTIONS.forEach((goal, index) => {
    const isSelected = goal1 === goal.key || goal2 === goal.key;
    const text = isSelected ? `✅ ${goal.label}` : goal.label;
    keyboard.text(text, goal.key);
    if ((index + 1) % 2 === 0) keyboard.row();
  });
  
  keyboard.row().text("✅ Done", "done_goals");
  return keyboard;
}

function createModeKeyboard() {
  const keyboard = new InlineKeyboard();
  
  MODE_OPTIONS.forEach(mode => {
    keyboard.text(mode.label, mode.key).row();
  });
  
  return keyboard;
}