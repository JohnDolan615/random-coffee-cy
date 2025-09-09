import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Random Coffee - Connect with Professionals',
  description: 'Meet interesting professionals in your field over coffee. Intelligent matching, easy scheduling, built for meaningful connections.',
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <span className="text-2xl">☕</span>
              <h1 className="ml-2 text-xl font-bold text-gray-900">Random Coffee</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="#features" className="text-gray-600 hover:text-gray-900">Features</Link>
              <Link href="#how-it-works" className="text-gray-600 hover:text-gray-900">How it Works</Link>
              <Link href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="secondary">Admin</Button>
              </Link>
              <Button>
                <span className="mr-2">📱</span>
                Start on Telegram
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Meet Amazing People
            <br />
            <span className="text-orange-600">Over Coffee</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Connect with professionals in your field through intelligent matching. 
            60-second onboarding, smart scheduling, meaningful conversations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-orange-600 hover:bg-orange-700">
              <span className="mr-2">🚀</span>
              Get Started on Telegram
            </Button>
            <Button variant="secondary" size="lg">
              <span className="mr-2">📺</span>
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Random Coffee?</h2>
            <p className="text-lg text-gray-600">Built for busy professionals who want meaningful connections</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Matching</h3>
              <p className="text-gray-600">AI-powered algorithm matches you based on profession, interests, goals, and availability.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">60-Second Setup</h3>
              <p className="text-gray-600">Quick onboarding gets you connected fast. No lengthy forms or complicated profiles.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📅</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Auto Scheduling</h3>
              <p className="text-gray-600">Automatic timezone detection and smart scheduling based on mutual availability.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600">From signup to coffee in just a few steps</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-orange-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-lg font-bold">1</div>
              <h3 className="font-semibold text-gray-900 mb-2">Quick Onboarding</h3>
              <p className="text-gray-600">Tell us about your profession, interests, and goals in under a minute.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-orange-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-lg font-bold">2</div>
              <h3 className="font-semibold text-gray-900 mb-2">Get Matched</h3>
              <p className="text-gray-600">Our algorithm finds the perfect person for you to meet based on mutual interests.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-orange-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-lg font-bold">3</div>
              <h3 className="font-semibold text-gray-900 mb-2">Schedule Coffee</h3>
              <p className="text-gray-600">Pick a time that works for both of you from suggested slots.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-orange-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-lg font-bold">4</div>
              <h3 className="font-semibold text-gray-900 mb-2">Meet & Connect</h3>
              <p className="text-gray-600">Enjoy your coffee chat and build meaningful professional relationships.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple Pricing</h2>
            <p className="text-lg text-gray-600">Pay with Telegram Stars (XTR) - secure and simple</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white border rounded-lg p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Free</h3>
              <div className="text-3xl font-bold text-gray-900 mb-4">0 XTR</div>
              <ul className="text-sm text-gray-600 space-y-2 mb-6">
                <li>• 1 match per week</li>
                <li>• Basic matching</li>
                <li>• Manual scheduling</li>
              </ul>
              <Button variant="secondary" className="w-full">Get Started</Button>
            </div>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-center relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-orange-600 text-white px-3 py-1 rounded-full text-xs font-semibold">POPULAR</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Pro Monthly</h3>
              <div className="text-3xl font-bold text-gray-900 mb-4">770 XTR</div>
              <ul className="text-sm text-gray-600 space-y-2 mb-6">
                <li>• 5 matches per week</li>
                <li>• Priority matching</li>
                <li>• Auto-scheduling</li>
                <li>• Advanced filters</li>
              </ul>
              <Button className="w-full bg-orange-600 hover:bg-orange-700">Upgrade to Pro</Button>
            </div>
            
            <div className="bg-white border rounded-lg p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Extra Match</h3>
              <div className="text-3xl font-bold text-gray-900 mb-4">150 XTR</div>
              <ul className="text-sm text-gray-600 space-y-2 mb-6">
                <li>• One additional match</li>
                <li>• This week only</li>
                <li>• Same great quality</li>
              </ul>
              <Button variant="secondary" className="w-full">Buy Extra</Button>
            </div>
            
            <div className="bg-white border rounded-lg p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Priority Boost</h3>
              <div className="text-3xl font-bold text-gray-900 mb-4">120 XTR</div>
              <ul className="text-sm text-gray-600 space-y-2 mb-6">
                <li>• 24h priority queue</li>
                <li>• Faster matching</li>
                <li>• Premium visibility</li>
              </ul>
              <Button variant="secondary" className="w-full">Get Priority</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <span className="text-2xl">☕</span>
                <span className="ml-2 text-xl font-bold text-white">Random Coffee</span>
              </div>
              <p className="text-sm">Connecting professionals one coffee at a time.</p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#features">Features</Link></li>
                <li><Link href="#pricing">Pricing</Link></li>
                <li><Link href="/dashboard">Admin</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/terms">Terms of Service</Link></li>
                <li><Link href="/privacy">Privacy Policy</Link></li>
                <li><a href="https://t.me/RandomCoffeeSupport">Contact Support</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Connect</h4>
              <div className="flex space-x-4">
                <a href="https://t.me/RandomCoffeeBot" className="text-gray-300 hover:text-white">
                  <span className="text-xl">📱</span>
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm">
            <p>&copy; 2024 Random Coffee Bot. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}