# React Form Builder - JotForm-Inspired

A powerful, user-friendly React form builder application with Supabase backend, inspired by JotForm's comprehensive feature set. Create beautiful, responsive forms with advanced functionality including conditional logic, analytics, device preview, and much more.

## 🌟 Key Features

### 🎨 **Enhanced Form Designer**
- **Drag & Drop Interface**: Intuitive field reordering with visual feedback
- **Live Form Preview**: Real-time preview as you build your form
- **Field Property Panel**: Comprehensive field configuration with validation rules
- **Professional Templates**: 8+ pre-built form templates for common use cases
- **AI-Powered Form Generation**: Create entire forms using natural language descriptions
- **AI Template Enhancement**: Use AI to enhance existing templates with additional fields
- **Visual Field Editing**: Click-to-edit interface with immediate visual feedback

### 📱 **Device Preview & Testing**
- **Multi-Device Preview**: Preview forms on desktop, tablet, and mobile devices
- **Auto-Fill with Dummy Data**: Test forms instantly with realistic sample data
- **Responsive Design**: Ensure forms look perfect on all screen sizes
- **Interactive Testing**: Fully functional preview mode

### 🔗 **Form Sharing & Distribution**
- **Direct Link Sharing**: Share forms via direct URLs
- **Embed Code Generation**: Get HTML embed codes for websites
- **Social Media Sharing**: Quick sharing to Facebook, Twitter, LinkedIn
- **QR Code Generation**: Create QR codes for easy mobile access

### 🧠 **Conditional Logic**
- **Dynamic Field Behavior**: Show/hide fields based on user responses
- **Smart Validation**: Make fields required or optional conditionally
- **Multiple Condition Types**: Support for various operators (equals, contains, greater than, etc.)
- **Visual Logic Builder**: Easy-to-use interface for creating complex rules

### 📊 **Advanced Analytics**
- **Comprehensive Metrics**: Track views, submissions, conversion rates
- **Submission Trends**: Visual charts showing form performance over time
- **Device Analytics**: Breakdown of submissions by device type
- **Drop-off Analysis**: Identify where users abandon forms
- **Field Performance**: Detailed statistics for each form field

### 🎛️ **Widget Library**
- **Extensive Field Types**: 15+ field types including text, email, file upload, date pickers
- **Custom Widgets**: Specialized inputs for specific use cases
- **Drag-to-Add**: Simple drag and drop to add fields to forms
- **Field Validation**: Built-in validation for all field types

### 💾 **Smart Draft Management**
- **Cross-Device Sync**: Access drafts from any device
- **Auto-Save**: Automatic saving as you work
- **Version History**: Track changes and restore previous versions
- **Cloud Storage**: Drafts stored securely in Supabase

### 🧠 **AI-Powered Form Creation**
- **Smart Field Generation**: Describe your form in plain English and let AI create the fields
- **Template Enhancement**: Use AI to add fields to existing templates  
- **Multiple AI Access Points**: Available in templates dialog and main form builder
- **Intelligent Field Types**: AI automatically selects appropriate field types and validation
- **Context-Aware Suggestions**: AI considers form purpose and generates relevant fields

### 📱 **Mobile-First Design**
- **Responsive Interface**: Optimized for all screen sizes
- **Touch-Friendly**: Intuitive touch interactions
- **Mobile Popups**: Welcome messages and guidance for mobile users
- **Progressive Web App**: App-like experience on mobile devices

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd react-form-builder
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file:
   ```env
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   REACT_APP_GROQ_API_KEY=your_groq_api_key (optional)
   ```

4. **Set up Supabase database**
   Run the SQL scripts in the `/sql` directory to create the necessary tables.

5. **Start the development server**
   ```bash
   npm start
   ```

## 📖 Usage Guide

### Creating Your First Form

1. **Choose a Starting Point**
   - Start from scratch with a blank form
   - Use AI Assistant to generate a form from a description
   - Use one of 8+ professional templates
   - Enhance any template with AI-generated additional fields
   - Categories: General, Survey, Registration, HR, E-commerce, Marketing, Booking

2. **Design Your Form**
   - Use the Widget Library to add fields
   - Drag and drop to reorder fields
   - Click fields to configure properties
   - Preview in real-time

3. **Add Smart Logic**
   - Set up conditional field visibility
   - Create dynamic validation rules
   - Configure field dependencies

4. **Test & Preview**
   - Use device preview for different screen sizes
   - Auto-fill with dummy data for testing
   - Verify all logic and validation works

5. **Share & Deploy**
   - Generate shareable links
   - Get embed codes for websites
   - Create QR codes for mobile access

---

### 🤖 **AI-Powered Features**

The form builder includes comprehensive AI integration to accelerate form creation:

#### **AI Form Generation**
- **Natural Language Input**: Describe your form needs in plain English
- **Smart Field Detection**: AI automatically identifies appropriate field types
- **Intelligent Validation**: AI suggests validation rules based on field purpose
- **Example**: "Contact form for a restaurant with name, email, phone, and message fields"

#### **Multiple AI Access Points**
- **Template Dialog**: Use AI directly when selecting templates
- **Form Builder**: Access AI assistant within the main building interface
- **Enhancement Mode**: Click the AI button on any template card for instant enhancement

#### **AI Best Practices**
- **Be Specific**: Provide detailed descriptions for better field suggestions
- **Iterate**: Use AI multiple times to refine and expand your forms
- **Review Results**: Always review AI-generated fields and adjust as needed
- **Combine Approaches**: Mix AI generation with manual field additions for optimal results

---

#### **AI Assistant in Design Mode**
- **Continuous Support**: AI assistant available throughout the design process
- **Field Suggestions**: Get AI recommendations for additional fields
- **Form Optimization**: AI provides suggestions to improve form effectiveness

#### **AI Integration Options**
- **Template Selection**: AI assistant prominently featured in template chooser
- **Design Tab**: Full AI capabilities in the main form builder
- **Enhancement Mode**: Quick AI enhancements for existing templates

---

Built with ❤️ using React, Supabase, and modern web technologies.
