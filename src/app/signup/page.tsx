"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, User, Building2, MapPin, Mail, Phone, Lock, CheckCircle, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth-client";
import { useSettings } from "@/hooks/useSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PasswordStrength from "@/components/ui/password-strength";
import GooglePlacesSimple from "@/components/ui/google-places-simple";

interface SignupFormData {
  // Personal Info
  firstName: string;
  lastName: string;
  
  // Business Info
  businessName: string;
  businessType: string;
  businessAddress: string;
  city: string;
  state: string;
  country: string;
  
  // Account Info
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

const BUSINESS_TYPES = [
  { value: "cafe", label: "Café" },
  { value: "qsr", label: "Quick Service Restaurant (QSR)" },
  { value: "fine-dining", label: "Fine Dining" },
  { value: "bar", label: "Bar & Pub" },
  { value: "bakery", label: "Bakery" },
  { value: "food-truck", label: "Food Truck" },
  { value: "catering", label: "Catering" },
  { value: "cloud-kitchen", label: "Cloud Kitchen" },
  { value: "food-court", label: "Food Court" },
  { value: "other", label: "Other" }
];

const COUNTRIES = [
  { value: "IN", label: "India" },
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "GB", label: "United Kingdom" },
  { value: "AU", label: "Australia" },
  { value: "SG", label: "Singapore" },
  { value: "AE", label: "UAE" },
  { value: "other", label: "Other" }
];

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [generatedSubdomain, setGeneratedSubdomain] = useState("");
  
  const router = useRouter();
  const { settings } = useSettings();

  const [formData, setFormData] = useState<SignupFormData>({
    firstName: "",
    lastName: "",
    businessName: "",
    businessType: "",
    businessAddress: "",
    city: "",
    state: "",
    country: "IN",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });

  // Generate subdomain from business name
  const generateSubdomain = (businessName: string) => {
    if (!businessName) return "";
    
    return businessName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .substring(0, 30); // Limit length
  };

  // Update subdomain when business name changes
  const handleBusinessNameChange = (value: string) => {
    setFormData(prev => ({ ...prev, businessName: value }));
    setGeneratedSubdomain(generateSubdomain(value));
  };

  // Handle Google Places selection
  const handlePlaceSelect = (place: any) => {
    const addressComponents = place.address_components || [];
    let city = "";
    let state = "";
    let country = "";

    addressComponents.forEach((component: any) => {
      const types = component.types;
      if (types.includes("locality")) {
        city = component.long_name;
      } else if (types.includes("administrative_area_level_1")) {
        state = component.long_name;
      } else if (types.includes("country")) {
        country = component.short_name;
      }
    });

    setFormData(prev => ({
      ...prev,
      businessAddress: place.formatted_address || place.name,
      city,
      state,
      country: country || prev.country
    }));
  };

  // Generate strong password
  const generateStrongPassword = () => {
    const length = 16;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    
    // Ensure at least one character from each category
    password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
    password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
    password += "0123456789"[Math.floor(Math.random() * 10)];
    password += "!@#$%^&*"[Math.floor(Math.random() * 8)];
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  const handleInputChange = (field: keyof SignupFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.firstName && formData.lastName && formData.businessName && formData.businessType);
      case 2:
        return !!(formData.businessAddress && formData.city && formData.state && formData.country);
      case 3:
        return !!(formData.email && formData.password && formData.confirmPassword && 
                 formData.password === formData.confirmPassword && formData.password.length >= 8);
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
      setError(null);
    } else {
      setError("Please fill in all required fields before proceeding.");
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
    setError(null);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(3)) {
      setError("Please fill in all required fields.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Create complete signup data
      const signupData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        businessName: formData.businessName,
        businessType: formData.businessType,
        businessAddress: formData.businessAddress,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        phone: formData.phone,
        email: formData.email,
        password: formData.password,
        subdomain: generatedSubdomain
      };

      // Call the new signup API
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupData)
      });

      if (response.ok) {
        const result = await response.json();
        setSuccess("Account created successfully! Redirecting to your restaurant dashboard...");
        setTimeout(() => {
          // Redirect to tenant subdomain
          if (result.tenant?.url) {
            window.location.href = result.tenant.url;
          } else {
            router.push("/dashboard");
          }
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Signup failed. Please try again.");
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError("Signup failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Get restaurant name from settings, fallback to 'HORDER' if not set
  const restaurantName = settings?.restaurantName || 'HORDER';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-green-900 relative flex items-center justify-center p-4 overflow-hidden">
      {/* Brand Header */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
        <h1 className="text-sm font-bold text-white drop-shadow-lg">Powered by HORDERS POS</h1>
      </div>

      {/* Signup Form Container */}
      <div className="w-full max-w-2xl relative z-10">
        <Card className="bg-white shadow-2xl border-0">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
              Join {restaurantName}
            </CardTitle>
            <CardDescription className="text-gray-600">
              Create your restaurant's POS account in just a few steps
            </CardDescription>
            
            {/* Progress Steps */}
            <div className="flex items-center justify-center mt-6 space-x-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {currentStep > step ? <CheckCircle className="w-4 h-4" /> : step}
                  </div>
                  {step < 3 && (
                    <div className={`w-12 h-0.5 ml-4 ${
                      currentStep > step ? 'bg-green-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            {/* Step 1: Personal & Business Info */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* First Name */}
                  <div>
                    <Label htmlFor="firstName" className="flex items-center space-x-2 mb-2">
                      <User className="w-4 h-4" />
                      <span>First Name *</span>
                    </Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="Enter your first name"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Last Name */}
                  <div>
                    <Label htmlFor="lastName" className="flex items-center space-x-2 mb-2">
                      <User className="w-4 h-4" />
                      <span>Last Name *</span>
                    </Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="Enter your last name"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Business Name */}
                <div>
                  <Label htmlFor="businessName" className="flex items-center space-x-2 mb-2">
                    <Building2 className="w-4 h-4" />
                    <span>Restaurant/Business Name *</span>
                  </Label>
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) => handleBusinessNameChange(e.target.value)}
                    placeholder="e.g., The Chai Wala"
                    disabled={isLoading}
                  />
                  {generatedSubdomain && (
                    <p className="text-sm text-gray-500 mt-1">
                      Your subdomain will be: <span className="font-mono text-green-600">{generatedSubdomain}.horder.com</span>
                    </p>
                  )}
                </div>

                {/* Business Type */}
                <div>
                  <Label htmlFor="businessType" className="flex items-center space-x-2 mb-2">
                    <Building2 className="w-4 h-4" />
                    <span>Business Type *</span>
                  </Label>
                  <Select
                    value={formData.businessType}
                    onValueChange={(value) => handleInputChange('businessType', value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your business type" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 2: Business Address */}
            {currentStep === 2 && (
              <div className="space-y-6">
                {/* Business Address with Google Places */}
                <div>
                  <Label htmlFor="businessAddress" className="flex items-center space-x-2 mb-2">
                    <MapPin className="w-4 h-4" />
                    <span>Business Address *</span>
                  </Label>
                  <GooglePlacesSimple
                    value={formData.businessAddress}
                    onChange={(value) => handleInputChange('businessAddress', value)}
                    onPlaceSelect={handlePlaceSelect}
                    placeholder="Start typing your business address..."
                    disabled={isLoading}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* City */}
                  <div>
                    <Label htmlFor="city" className="mb-2">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="City"
                      disabled={isLoading}
                    />
                  </div>

                  {/* State */}
                  <div>
                    <Label htmlFor="state" className="mb-2">State/Province *</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="State"
                      disabled={isLoading}
                    />
          </div>

                  {/* Country */}
                  <div>
                    <Label htmlFor="country" className="mb-2">Country *</Label>
                    <Select
                      value={formData.country}
                      onValueChange={(value) => handleInputChange('country', value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((country) => (
                          <SelectItem key={country.value} value={country.value}>
                            {country.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Account Details */}
            {currentStep === 3 && (
              <div className="space-y-6">
                {/* Email */}
            <div>
                  <Label htmlFor="email" className="flex items-center space-x-2 mb-2">
                    <Mail className="w-4 h-4" />
                    <span>Email Address *</span>
                  </Label>
                  <Input
                    id="email"
                type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter your email address"
                    disabled={isLoading}
                  />
                </div>

                {/* Phone */}
                <div>
                  <Label htmlFor="phone" className="flex items-center space-x-2 mb-2">
                    <Phone className="w-4 h-4" />
                    <span>Phone Number (Optional)</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter your phone number"
                disabled={isLoading}
              />
            </div>

                {/* Password */}
            <div>
                  <Label htmlFor="password" className="flex items-center space-x-2 mb-2">
                    <Lock className="w-4 h-4" />
                    <span>Password *</span>
                  </Label>
              <div className="relative">
                    <Input
                      id="password"
                  type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Create a strong password"
                  disabled={isLoading}
                      className="pr-20"
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newPassword = generateStrongPassword();
                          handleInputChange('password', newPassword);
                          handleInputChange('confirmPassword', newPassword);
                        }}
                        className="h-8 px-2 text-xs"
                        disabled={isLoading}
                      >
                        Generate
                      </Button>
                      <Button
                  type="button"
                        variant="ghost"
                        size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                        className="h-8 px-2"
                  disabled={isLoading}
                >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
              </div>
                  </div>
                  <PasswordStrength password={formData.password} className="mt-2" />
            </div>

                {/* Confirm Password */}
                <div>
                  <Label htmlFor="confirmPassword" className="flex items-center space-x-2 mb-2">
                    <Lock className="w-4 h-4" />
                    <span>Confirm Password *</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      placeholder="Confirm your password"
                      disabled={isLoading}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 px-2"
              disabled={isLoading}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-sm text-red-600 mt-1">Passwords do not match</p>
                  )}
                </div>
              </div>
              )}

          {/* Error Message */}
          {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              {currentStep > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={isLoading}
                >
                  Previous
                </Button>
              ) : (
                <div />
              )}

              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!validateStep(currentStep) || isLoading}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSignup}
                  disabled={!validateStep(3) || isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Creating Account...</span>
                    </div>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              )}
            </div>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <button
                onClick={() => router.push("/")}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Sign in
              </button>
            </p>
          </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
