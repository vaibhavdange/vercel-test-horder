# HORDER - Point of Sale System

A modern, professional Point of Sale system designed for restaurants and retail businesses. Built with Next.js 15, TypeScript, and Tailwind CSS.

## 🎨 Design Features

- **Modern UI/UX**: Clean, professional interface with white backgrounds and green accents
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Dark Mode Ready**: Built with CSS variables for easy theme switching
- **Professional Branding**: HORDER branding throughout the system

## 🚀 Features

### Dashboard
- Key Performance Indicators (KPIs)
- Daily sales, monthly revenue, and table occupancy tracking
- Popular dishes analytics
- Overview charts and data visualization

### Menu Management
- Category-based menu organization
- Product management with images and descriptions
- Stock tracking and availability status
- Add/edit/delete menu items and categories

### Staff Management
- Employee profiles and information
- Attendance tracking with status indicators
- Role-based permissions
- Shift scheduling and salary management

### Inventory Management
- Real-time stock tracking
- Product categorization and filtering
- Low stock alerts
- Inventory reports and analytics

### Reports & Analytics
- Reservation reports
- Revenue analysis
- Staff performance metrics
- Custom date range filtering

### Order Management
- Real-time order tracking
- Status updates (In Process, Ready, Completed, cancelled)
- Customer information management
- Payment processing integration

### Reservation System
- Table reservation management
- Floor-based organization
- Time slot scheduling
- Customer details and preferences

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Icons**: Lucide React
- **State Management**: React hooks and local state
- **Build Tool**: Next.js with Turbopack
- **Desktop App**: Electron integration ready

## 📱 Pages & Routes

- `/` - Login page
- `/dashboard` - Main dashboard with KPIs
- `/dashboard/menu` - Menu management
- `/dashboard/staff` - Staff management
- `/dashboard/inventory` - Inventory management
- `/dashboard/reports` - Reports and analytics
- `/dashboard/orders` - Order management
- `/dashboard/reservation` - Reservation system
- `/dashboard/settings` - User profile and system settings

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd horder-pos
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

### Electron Desktop App

```bash
npm run electron-dev    # Development mode
npm run electron-build  # Build for distribution
```

## 🎯 Key Components

- **Sidebar**: Navigation with HORDER branding
- **Header**: Page titles and user actions
- **Dashboard Cards**: KPI displays and analytics
- **Data Tables**: Sortable and filterable data views
- **Modals**: Add/edit forms for all entities
- **Status Indicators**: Color-coded status tracking

## 🎨 Design System

### Colors
- **Primary**: Green (#16a34a) - Used for buttons, active states, and accents
- **Background**: White (#ffffff) - Clean, professional appearance
- **Text**: Dark gray (#111827) - High contrast for readability
- **Borders**: Light gray (#e5e7eb) - Subtle separation

### Typography
- **Font Family**: Inter (Google Fonts)
- **Headings**: Bold weights for hierarchy
- **Body Text**: Regular weights for content
- **Sizes**: Responsive scale from xs to 4xl

### Components
- **Cards**: Rounded corners with subtle shadows
- **Buttons**: Green primary, gray secondary, red destructive
- **Forms**: Consistent input styling with focus states
- **Tables**: Clean, organized data presentation

## 🔧 Customization

The system is built with CSS variables and Tailwind CSS, making it easy to customize:

- **Colors**: Modify CSS variables in `globals.css`
- **Components**: Update component files in `src/components/`
- **Layouts**: Modify page layouts in `src/app/`
- **Styling**: Adjust Tailwind classes throughout components

## 📊 Data Structure

The system is designed to work with various data sources:
- **Mock Data**: Currently uses static data for demonstration
- **API Integration**: Ready for backend API integration
- **Database**: Compatible with SQL and NoSQL databases
- **Real-time**: WebSocket ready for live updates

## 🚀 Future Enhancements

- **Real-time Updates**: WebSocket integration for live data
- **Mobile App**: React Native companion app
- **Advanced Analytics**: Machine learning insights
- **Multi-language**: Internationalization support
- **Cloud Sync**: Offline-first with cloud synchronization
- **Payment Integration**: Stripe, PayPal, and local payment methods

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code examples

---

**HORDER** - Professional Point of Sale Solutions
