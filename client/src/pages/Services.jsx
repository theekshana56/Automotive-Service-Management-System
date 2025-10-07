import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const services = [
  {
    id: 1,
    title: "Engine Diagnostics",
    description: "Complete engine analysis with advanced diagnostic tools and computer scanning.",
    price: "99",
    duration: "45 min",
    rating: 4.9,
    category: "Engine",
    popular: true,
    features: [
      "OBD-II Computer Scanning",
      "Engine Performance Analysis",
      "Trouble Code Reading",
      "Diagnostic Report",
      "Recommendations for Repairs"
    ]
  },
  {
    id: 2,
    title: "Brake Service",
    description: "Professional brake inspection, repair, and replacement services.",
    price: "75",
    duration: "30 min",
    rating: 4.8,
    category: "Safety",
    features: [
      "Brake Pad Inspection",
      "Rotor Condition Check",
      "Brake Fluid Analysis",
      "Brake Line Inspection",
      "Safety Recommendations"
    ]
  },
  {
    id: 3,
    title: "Oil Change Plus",
    description: "Premium oil change with multi-point inspection and fluid top-up.",
    price: "45",
    duration: "20 min",
    rating: 4.7,
    category: "Maintenance",
    features: [
      "Premium Oil Filter",
      "Multi-Point Inspection",
      "Fluid Level Check",
      "Tire Pressure Check",
      "Wash and Vacuum"
    ]
  },
  {
    id: 4,
    title: "Tire Service",
    description: "Tire rotation, balancing, and replacement services.",
    price: "65",
    duration: "35 min",
    rating: 4.8,
    category: "Tires",
    features: [
      "Tire Rotation",
      "Wheel Balancing",
      "Tire Pressure Check",
      "Tread Depth Analysis",
      "Alignment Check"
    ]
  },
  {
    id: 5,
    title: "AC Repair",
    description: "Air conditioning diagnosis and repair services.",
    price: "85",
    duration: "60 min",
    rating: 4.6,
    category: "Comfort",
    features: [
      "AC System Diagnosis",
      "Refrigerant Check",
      "Compressor Testing",
      "Hose Inspection",
      "Performance Testing"
    ]
  },
  {
    id: 6,
    title: "Transmission Service",
    description: "Transmission fluid change and system maintenance.",
    price: "120",
    duration: "90 min",
    rating: 4.9,
    category: "Drivetrain",
    features: [
      "Transmission Fluid Change",
      "Filter Replacement",
      "System Flush",
      "Performance Testing",
      "Leak Inspection"
    ]
  },
  {
    id: 7,
    title: "Battery Service",
    description: "Battery testing, charging, and replacement services.",
    price: "55",
    duration: "25 min",
    rating: 4.7,
    category: "Electrical",
    features: [
      "Battery Load Testing",
      "Charging System Check",
      "Terminal Cleaning",
      "Battery Replacement",
      "Warranty Information"
    ]
  },
  {
    id: 8,
    title: "General Maintenance",
    description: "Comprehensive vehicle maintenance and inspection services.",
    price: "95",
    duration: "75 min",
    rating: 4.8,
    category: "Maintenance",
    features: [
      "Full Vehicle Inspection",
      "Filter Replacements",
      "Belt Condition Check",
      "Hose Inspection",
      "Maintenance Schedule"
    ]
  }
];

const categories = ["All", "Engine", "Safety", "Maintenance", "Tires", "Comfort", "Drivetrain", "Electrical"];

export default function Services() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredServices = services.filter(service => {
    const matchesCategory = selectedCategory === "All" || service.category === selectedCategory;
    const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryColor = (category) => {
    const colors = {
      "Engine": "from-red-500 to-orange-500",
      "Safety": "from-blue-500 to-indigo-500",
      "Maintenance": "from-green-500 to-emerald-500",
      "Tires": "from-purple-500 to-violet-500",
      "Comfort": "from-pink-500 to-rose-500",
      "Drivetrain": "from-amber-500 to-yellow-500",
      "Electrical": "from-cyan-500 to-teal-500"
    };
    return colors[category] || "from-gray-500 to-slate-500";
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Professional Services
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              Our Services
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto font-light">
              Comprehensive automotive services with certified mechanics and transparent pricing
            </p>
          </div>

          {/* Search and Filter */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="flex-1 relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/50 backdrop-blur-sm border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => navigate('/book')}
                className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Book Service
              </button>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                      : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {filteredServices.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-.881-5.85-2.291A7.962 7.962 0 0112 10a7.962 7.962 0 015.85 2.709z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">No Services Found</h3>
              <p className="text-slate-400">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filteredServices.map((service) => (
                <div key={service.id} className="group relative bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-slate-700/50 hover:border-indigo-500/30">
                  {service.popular && (
                    <div className="absolute -top-3 left-4">
                      <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="mb-4">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${getCategoryColor(service.category)} text-white mb-3`}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      {service.category}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{service.title}</h3>
                    <p className="text-slate-300 text-sm leading-relaxed">{service.description}</p>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className={`h-4 w-4 ${i < Math.floor(service.rating) ? 'fill-current' : 'text-slate-600'}`} viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm text-slate-400">({service.rating})</span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">${service.price}</div>
                      <div className="text-sm text-slate-400">{service.duration}</div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-indigo-300 mb-2">What's Included:</h4>
                    <ul className="space-y-1">
                      {service.features.map((feature, index) => (
                        <li key={index} className="text-xs text-slate-300 flex items-center gap-2">
                          <svg className="h-3 w-3 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105">
                    Book This Service
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Need a Custom Service?
            </h2>
            <p className="text-xl text-slate-300 mb-8 font-light">
              Don't see what you need? Our certified mechanics can handle custom repairs and maintenance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/contact')}
                className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Contact Us
              </button>
              <button
                onClick={() => navigate('/find-mechanic')}
                className="px-8 py-4 bg-transparent border-2 border-indigo-400/50 text-white font-semibold rounded-xl hover:bg-indigo-500/20 hover:border-indigo-400 transition-all"
              >
                Find a Mechanic
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
