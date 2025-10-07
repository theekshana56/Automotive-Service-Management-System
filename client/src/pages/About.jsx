import React from 'react';
import { useNavigate } from 'react-router-dom';

const teamMembers = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Chief Executive Officer",
    bio: "With over 15 years in automotive industry leadership, Sarah founded Auto Elite with a vision to revolutionize automotive services through technology and exceptional customer service.",
    image: "/assets/car.jpg",
    achievements: ["15+ years experience", "Former VP at AutoNation", "MBA from Wharton"]
  },
  {
    id: 2,
    name: "Mike Chen",
    role: "Chief Technology Officer",
    bio: "Mike leads our technology innovation, bringing cutting-edge solutions to automotive service management. His expertise in AI and mobile applications drives our platform's success.",
    image: "/assets/car.jpg",
    achievements: ["Former Google Engineer", "PhD in Computer Science", "10+ patents"]
  },
  {
    id: 3,
    name: "Dr. Robert Martinez",
    role: "Head of Mechanic Relations",
    bio: "Dr. Martinez ensures our mechanics meet the highest standards of certification and training. He oversees our rigorous mechanic onboarding and quality assurance programs.",
    image: "/assets/car.jpg",
    achievements: ["ASE Master Technician", "20+ years experience", "Training program director"]
  },
  {
    id: 4,
    name: "Emily Davis",
    role: "Customer Experience Director",
    bio: "Emily ensures every customer interaction exceeds expectations. She leads our customer service team and develops programs that prioritize transparency and satisfaction.",
    image: "/assets/car.jpg",
    achievements: ["10+ years CX leadership", "Six Sigma certified", "NPS score improvement"]
  }
];

const stats = [
  { number: "50,000+", label: "Happy Customers", icon: "users" },
  { number: "1,200+", label: "Certified Mechanics", icon: "wrench" },
  { number: "98%", label: "Customer Satisfaction", icon: "star" },
  { number: "24/7", label: "Service Available", icon: "clock" }
];

const values = [
  {
    title: "Quality First",
    description: "We never compromise on the quality of our services or the expertise of our mechanics.",
    icon: "shield-check"
  },
  {
    title: "Transparency",
    description: "Complete pricing transparency with no hidden fees or surprise charges.",
    icon: "eye"
  },
  {
    title: "Innovation",
    description: "Leveraging technology to make automotive services more accessible and efficient.",
    icon: "light-bulb"
  },
  {
    title: "Community",
    description: "Building lasting relationships with our customers and supporting local mechanics.",
    icon: "users"
  }
];

export default function About() {
  const navigate = useNavigate();

  const getIcon = (iconName) => {
    const icons = {
      "users": (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      "wrench": (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      "star": (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.07-1.371-1.81-.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
      "clock": (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      "shield-check": (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      "eye": (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      "light-bulb": (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    };
    return icons[iconName] || icons["users"];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-purple-900/20 to-pink-900/20" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4 shadow-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              About Auto Elite
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              Revolutionizing Auto Care
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto font-light leading-relaxed">
              We're on a mission to transform the automotive service industry by connecting customers
              with certified mechanics through innovative technology and exceptional service standards.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-6 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 hover:border-indigo-500/30 transition-all hover:-translate-y-1">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <div className="text-white">
                    {getIcon(stat.icon)}
                  </div>
                </div>
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.number}</div>
                <div className="text-slate-400 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Our Story
              </h2>
              <p className="text-xl text-slate-300 font-light leading-relaxed">
                Founded in 2020, Auto Elite emerged from a simple observation: finding reliable,
                trustworthy automotive services shouldn't be a challenge.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">The Problem We Solve</h3>
                <p className="text-slate-300 mb-6 leading-relaxed">
                  Traditional automotive service experiences are often frustrating, with hidden costs,
                  unreliable scheduling, and uncertain quality. Customers deserve better.
                </p>
                <p className="text-slate-300 mb-6 leading-relaxed">
                  We created Auto Elite to bridge this gap, providing a platform where customers
                  can easily find certified mechanics, book services with transparent pricing,
                  and receive quality service they can trust.
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 bg-indigo-500/20 text-indigo-300 px-3 py-2 rounded-lg">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm font-semibold">Transparent Pricing</span>
                  </div>
                  <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-3 py-2 rounded-lg">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm font-semibold">Certified Mechanics</span>
                  </div>
                  <div className="flex items-center gap-2 bg-purple-500/20 text-purple-300 px-3 py-2 rounded-lg">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm font-semibold">24/7 Support</span>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="aspect-video bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <p className="text-slate-300 font-medium">Auto Elite Platform</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Our Values
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto font-light">
              The principles that guide everything we do, from mechanic partnerships to customer service
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center p-6 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 hover:border-indigo-500/30 transition-all hover:-translate-y-1">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <div className="text-white">
                    {getIcon(value.icon)}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{value.title}</h3>
                <p className="text-slate-300 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Meet Our Team
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto font-light">
              The passionate leaders driving Auto Elite's mission to transform automotive services
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member) => (
              <div key={member.id} className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-slate-700/50 hover:border-indigo-500/30">
                <div className="relative mb-6">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full aspect-square object-cover rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent rounded-xl" />
                </div>

                <div className="text-center">
                  <h3 className="text-xl font-bold text-white mb-1">{member.name}</h3>
                  <p className="text-indigo-400 font-medium mb-3">{member.role}</p>
                  <p className="text-slate-300 text-sm leading-relaxed mb-4">{member.bio}</p>

                  <div className="space-y-2">
                    {member.achievements.map((achievement, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs text-slate-400">
                        <svg className="w-3 h-3 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {achievement}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Our Mission
            </h2>
            <p className="text-xl text-slate-300 mb-8 font-light leading-relaxed">
              To democratize automotive services by providing customers with easy access to certified,
              trustworthy mechanics while empowering automotive professionals with the tools and
              opportunities they need to succeed.
            </p>
            <div className="grid md:grid-cols-3 gap-8 mt-12">
              <div className="p-6 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Innovation</h3>
                <p className="text-slate-300 text-sm">Continuously improving our platform with cutting-edge technology</p>
              </div>
              <div className="p-6 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Trust</h3>
                <p className="text-slate-300 text-sm">Building lasting relationships through transparency and reliability</p>
              </div>
              <div className="p-6 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Community</h3>
                <p className="text-slate-300 text-sm">Supporting mechanics and customers in building stronger communities</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Join the Auto Elite Community
            </h2>
            <p className="text-xl text-slate-300 mb-8 font-light">
              Whether you're looking for reliable automotive services or want to join our network
              of certified mechanics, we'd love to have you as part of our community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/services')}
                className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Explore Services
              </button>
              <button
                onClick={() => navigate('/contact')}
                className="px-8 py-4 bg-transparent border-2 border-indigo-400/50 text-white font-semibold rounded-xl hover:bg-indigo-500/20 hover:border-indigo-400 transition-all"
              >
                Get in Touch
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
