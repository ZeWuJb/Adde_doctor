import { useState } from "react";
import {
  HelpCircle,
  Search,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  MessageSquare,
  FileText,
  Video,
  Calendar,
  Settings,
  BookOpen,
} from "lucide-react";

const HelpPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const toggleFaq = (index) => {
    if (expandedFaq === index) {
      setExpandedFaq(null);
    } else {
      setExpandedFaq(index);
    }
  };

  const faqs = [
    {
      question: "How do I manage my appointment schedule?",
      answer:
        "You can manage your appointment schedule by navigating to the Appointments page. From there, you can view upcoming appointments, accept or decline appointment requests, and set your availability. You can also click on any appointment to view details or make changes.",
      category: "appointments",
    },
    {
      question: "How do I update my availability?",
      answer:
        "To update your availability, go to the Appointments page and click on 'Manage Availability'. You can set your working hours for each day of the week, block out specific dates or times, and set recurring availability patterns.",
      category: "appointments",
    },
    {
      question: "How do I start a video consultation?",
      answer:
        "When it's time for your scheduled video consultation, go to the Appointments page and find the appointment. Click on 'Join Call' to start the video consultation. Make sure your camera and microphone are working properly before joining.",
      category: "consultations",
    },
    {
      question: "How do I generate reports?",
      answer:
        "To generate reports, go to the Reports page. Select the type of report you want to generate, specify the date range, and click 'Generate Report'. You can download reports in CSV format for further analysis.",
      category: "reports",
    },
    {
      question: "How do I update my profile information?",
      answer:
        "To update your profile information, go to the Profile page by clicking on your name in the top-right corner. From there, you can edit your personal information, professional details, and upload a new profile picture.",
      category: "account",
    },
    {
      question: "How do I change my password?",
      answer:
        "To change your password, go to the Settings page and select the Security tab. Enter your current password and your new password, then click 'Update Password'.",
      category: "account",
    },
    {
      question: "How do I get notified of new appointment requests?",
      answer:
        "By default, you'll receive in-app notifications for new appointment requests. You can also enable email and SMS notifications in the Settings page under the Notifications tab.",
      category: "notifications",
    },
    {
      question: "What should I do if I can't access my account?",
      answer:
        "If you're having trouble accessing your account, first try resetting your password using the 'Forgot Password' link on the login page. If that doesn't work, contact our support team for assistance.",
      category: "account",
    },
    {
      question: "How do I handle technical issues during video calls?",
      answer:
        "If you experience technical issues during a video call, try refreshing your browser first. Check your internet connection and ensure your camera and microphone permissions are enabled. If problems persist, you can reschedule the appointment.",
      category: "consultations",
    },
  ];

  const categories = [
    { id: "all", name: "All Topics", icon: <BookOpen className="h-5 w-5" /> },
    { id: "appointments", name: "Appointments", icon: <Calendar className="h-5 w-5" /> },
    { id: "consultations", name: "Video Consultations", icon: <Video className="h-5 w-5" /> },
    { id: "reports", name: "Reports", icon: <FileText className="h-5 w-5" /> },
    { id: "account", name: "Account Settings", icon: <Settings className="h-5 w-5" /> },
    { id: "notifications", name: "Notifications", icon: <MessageSquare className="h-5 w-5" /> },
  ];

  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch = searchTerm
      ? faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });


  return (
    <div className="container mx-auto py-6 px-4 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-3">Help & Support</h1>
        <p className="text-lg text-gray-600">Find answers to common questions and get the support you need</p>
      </div>

      {/* Search */}
      <div className="mb-8">
        <div className="relative max-w-2xl mx-auto">
          <input
            type="text"
            placeholder="Search for help articles, guides, or FAQs..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white"
          />
          <Search className="absolute left-4 top-4 h-6 w-6 text-gray-400" />
        </div>
      </div>

    

      {/* Category Filter */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === category.id
                  ? "bg-pink-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {category.icon}
              <span className="ml-2">{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* FAQs */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          {searchTerm ? `Search Results (${filteredFaqs.length})` : "Frequently Asked Questions"}
        </h2>

        {filteredFaqs.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-200">
            {filteredFaqs.map((faq, index) => (
              <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                <button className="flex justify-between items-start w-full text-left" onClick={() => toggleFaq(index)}>
                  <h3 className="text-lg font-medium text-white-900 pr-4">{faq.question}</h3>
                  <div className="flex-shrink-0">
                    {expandedFaq === index ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                </button>
                {expandedFaq === index && (
                  <div className="mt-4 pr-8">
                    <p className="text-gray-800 leading-relaxed">{faq.answer}</p>
                    <div className="mt-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800 capitalize">
                        {faq.category}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
            <HelpCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-700 mb-6 max-w-md mx-auto">
              We couldn’t find any help articles matching your search. Try different keywords or browse our categories above.
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
              }}
              className="px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 font-medium"
            >
              Clear Search
            </button>
          </div>
        )}
      </div>

      {/* Contact Support */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-8 border border-pink-200">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Still Need Help?</h2>
          <p className="text-gray-600 mb-8 text-lg">
            Our support team is here to help you with any questions or issues you may have. We’re committed to providing you with the best possible experience.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <Mail className="h-10 w-10 text-pink-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Support</h3>
              <p className="text-gray-500 mb-4">Get a response within 24 hours</p>
              <a
                href="mailto:support@healthcareapp.com"
                className="inline-flex items-center text-pink-600 hover:text-pink-700 font-medium"
              >
                devgroup020@gmail.com
                <MessageSquare className="h-4 w-4 ml-2" />
              </a>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <Phone className="h-10 w-10 text-pink-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Phone Support</h3>
              <p className="text-gray-500 mb-4">Available Mon-Fri, 9am-5pm</p>
              <a
                href="tel:+1234567890"
                className="inline-flex items-center text-pink-600 hover:text-pink-700 font-medium"
              >
                +251 90 000 0000
                <Phone className="h-4 w-4 ml-2" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;