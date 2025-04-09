"use client"

import { useState } from "react"
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
  User,
  Settings,
} from "lucide-react"

const HelpPage = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedFaq, setExpandedFaq] = useState(null)

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
  }

  const toggleFaq = (index) => {
    if (expandedFaq === index) {
      setExpandedFaq(null)
    } else {
      setExpandedFaq(index)
    }
  }

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
      question: "How do I view patient records?",
      answer:
        "You can view patient records by going to the Patients page. Search for the patient by name or email, then click on their profile to view their complete medical history, appointment history, and other details.",
      category: "patients",
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
  ]

  const filteredFaqs = searchTerm
    ? faqs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : faqs

  const helpCategories = [
    {
      title: "Appointments",
      icon: <Calendar className="h-8 w-8 text-primary-500 mb-2" />,
      description: "Managing your schedule and availability",
    },
    {
      title: "Video Consultations",
      icon: <Video className="h-8 w-8 text-primary-500 mb-2" />,
      description: "Conducting virtual appointments",
    },
    {
      title: "Patient Management",
      icon: <User className="h-8 w-8 text-primary-500 mb-2" />,
      description: "Viewing and updating patient records",
    },
    {
      title: "Reports & Analytics",
      icon: <FileText className="h-8 w-8 text-primary-500 mb-2" />,
      description: "Generating insights from your practice",
    },
    {
      title: "Account Settings",
      icon: <Settings className="h-8 w-8 text-primary-500 mb-2" />,
      description: "Managing your profile and preferences",
    },
    {
      title: "Notifications",
      icon: <MessageSquare className="h-8 w-8 text-primary-500 mb-2" />,
      description: "Setting up alerts and reminders",
    },
  ]

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Help & Support</h1>
        <p className="text-gray-600">Find answers to common questions and get support</p>
      </div>

      {/* Search */}
      <div className="mb-8">
        <div className="relative max-w-md mx-auto">
          <input
            type="text"
            placeholder="Search for help..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500"
          />
          <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
        </div>
      </div>

      {/* Help Categories */}
      {!searchTerm && (
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Help Categories</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {helpCategories.map((category, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-100"
              >
                <div className="flex flex-col items-center text-center">
                  {category.icon}
                  <h3 className="text-lg font-medium text-gray-900 mb-1">{category.title}</h3>
                  <p className="text-gray-500">{category.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQs */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          {searchTerm ? `Search Results for "${searchTerm}"` : "Frequently Asked Questions"}
        </h2>

        {filteredFaqs.length > 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 divide-y divide-gray-200">
            {filteredFaqs.map((faq, index) => (
              <div key={index} className="p-6">
                <button className="flex justify-between items-center w-full text-left" onClick={() => toggleFaq(index)}>
                  <h3 className="text-lg font-medium text-gray-900">{faq.question}</h3>
                  {expandedFaq === index ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </button>
                {expandedFaq === index && (
                  <div className="mt-4 text-gray-600">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <HelpCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No results found</h3>
            <p className="text-gray-500 mb-4">
              We couldn`t find any help articles matching your search. Try different keywords or contact support.
            </p>
            <button className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
              Contact Support
            </button>
          </div>
        )}
      </div>

      {/* Contact Support */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Still Need Help?</h2>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-gray-600 mb-6">
              Our support team is available to help you with any questions or issues you may have.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 border border-gray-200 rounded-lg">
                <Mail className="h-8 w-8 text-primary-500 mx-auto mb-2" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">Email Support</h3>
                <p className="text-gray-500 mb-4">Get a response within 24 hours</p>
                <a
                  href="mailto:support@healthcareapp.com"
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  support@healthcareapp.com
                </a>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <Phone className="h-8 w-8 text-primary-500 mx-auto mb-2" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">Phone Support</h3>
                <p className="text-gray-500 mb-4">Available Mon-Fri, 9am-5pm</p>
                <a href="tel:+1234567890" className="text-primary-600 hover:text-primary-700 font-medium">
                  +1 (234) 567-890
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HelpPage

