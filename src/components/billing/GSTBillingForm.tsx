"use client";

import { useState, useEffect } from 'react';
import { useRegion } from '@/hooks/use-region';
import { useCurrency } from '@/hooks/useCurrency';
import { GSTService } from '@/lib/services/gst-service';
import { InvoiceItem, TaxSummary } from '@/types/invoice';
import { OrderItem } from '@/types/orders';
import { 
  Receipt, 
  User, 
  Phone, 
  MapPin, 
  Building, 
  Calculator,
  FileText,
  Download,
  Mail,
  Printer
} from 'lucide-react';

interface GSTBillingFormProps {
  orderItems: OrderItem[];
  onInvoiceGenerated: (invoiceData: any) => void;
  className?: string;
}

export default function GSTBillingForm({ 
  orderItems, 
  onInvoiceGenerated, 
  className = '' 
}: GSTBillingFormProps) {
  const { currentRegion, regions: availableRegions } = useRegion();
  const { format } = useCurrency();
  
  // Add null check and default value
  const safeCurrentRegion = currentRegion || availableRegions[0];
  const [gstService] = useState(() => new GSTService(safeCurrentRegion));
  
  // Customer details
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerGstin, setCustomerGstin] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  
  // Billing items
  const [billingItems, setBillingItems] = useState<Omit<InvoiceItem, 'id' | 'taxAmount' | 'lineTotal'>[]>([]);
  
  // Summary
  const [subtotal, setSubtotal] = useState(0);
  const [taxSummary, setTaxSummary] = useState<TaxSummary>({
    cgstAmount: 0,
    sgstAmount: 0,
    igstAmount: 0,
    totalTaxAmount: 0,
  });
  const [discount, setDiscount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  
  // UI state
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Convert order items to billing items
    const items = orderItems.map(item => ({
      itemId: item.productId,
      name: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      hsnCode: gstService.getHSNCodeForCategory(item.product?.category?.name || 'food'),
      taxSlab: gstService.getTaxRateForCategory(item.product?.category?.name || 'food'),
    }));
    
    setBillingItems(items);
  }, [orderItems, gstService]);

  useEffect(() => {
    // Calculate totals
    const newSubtotal = billingItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const newTaxSummary = gstService.calculateTaxSummary(billingItems);
    const newTotalAmount = newSubtotal + newTaxSummary.totalTaxAmount - discount;
    
    setSubtotal(newSubtotal);
    setTaxSummary(newTaxSummary);
    setTotalAmount(newTotalAmount);
  }, [billingItems, discount, gstService]);

  const handleTaxRateChange = (index: number, newRate: number) => {
    const updatedItems = [...billingItems];
    updatedItems[index] = { ...updatedItems[index], taxSlab: newRate };
    setBillingItems(updatedItems);
  };

  const handleGenerateInvoice = async () => {
    if (!customerName.trim()) {
      alert('Please enter customer name');
      return;
    }

    setIsGenerating(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const invoiceData = {
        invoiceNumber: gstService.generateInvoiceNumber(),
        customerName,
        customerPhone,
        customerGstin,
        customerAddress,
        items: billingItems.map(item => ({
          ...item,
          ...gstService.calculateItemGST(item),
        })),
        taxSummary,
        subtotal,
        discount,
        totalAmount,
        amountInWords: gstService.amountInWords(totalAmount),
        region: currentRegion,
        generatedAt: new Date(),
      };
      
      onInvoiceGenerated(invoiceData);
      setShowInvoicePreview(true);
    } catch (error) {
      console.error('Failed to generate invoice:', error);
      alert('Failed to generate invoice. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    // TODO: Implement export functionality
    console.log(`Exporting as ${format}`);
  };

  const handleEmail = () => {
    // TODO: Implement email functionality
    console.log('Sending invoice via email');
  };

  const handlePrint = () => {
    // TODO: Implement print functionality
    console.log('Printing invoice');
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Receipt className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            GST Billing - {safeCurrentRegion?.name || 'Default'}
          </h2>
        </div>
        <div className="text-sm text-gray-500">
          {safeCurrentRegion?.currency || 'INR'} • {safeCurrentRegion?.dateFormat || 'DD/MM/YYYY'}
        </div>
      </div>

      {/* Customer Details */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <User className="h-5 w-5 text-gray-500 mr-2" />
          Customer Details
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Name *
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter customer name"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter phone number"
            />
          </div>
          
          {safeCurrentRegion?.id === 'india' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GSTIN (Optional)
                </label>
                <input
                  type="text"
                  value={customerGstin}
                  onChange={(e) => setCustomerGstin(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter GSTIN"
                  pattern="^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter address"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Billing Items */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Calculator className="h-5 w-5 text-gray-500 mr-2" />
          Billing Items
        </h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Qty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                {safeCurrentRegion?.id === 'india' && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      HSN
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tax %
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {billingItems.map((item, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(item.unitPrice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(item.totalPrice)}
                  </td>
                  {safeCurrentRegion?.id === 'india' && (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.hsnCode}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <select
                          value={item.taxSlab}
                          onChange={(e) => handleTaxRateChange(index, Number(e.target.value))}
                          className="border border-gray-300 rounded px-2 py-1 text-sm"
                        >
                          <option value={0}>0%</option>
                          <option value={5}>5%</option>
                          <option value={12}>12%</option>
                          <option value={18}>18%</option>
                          <option value={28}>28%</option>
                        </select>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <FileText className="h-5 w-5 text-gray-500 mr-2" />
          Bill Summary
        </h3>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">{format(subtotal)}</span>
          </div>
          
          {safeCurrentRegion?.id === 'india' && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-600">CGST:</span>
                <span className="font-medium">{format(taxSummary.cgstAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">SGST:</span>
                <span className="font-medium">{format(taxSummary.sgstAmount)}</span>
              </div>
              {taxSummary.igstAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">IGST:</span>
                  <span className="font-medium">{format(taxSummary.igstAmount)}</span>
                </div>
              )}
            </>
          )}
          
          <div className="flex justify-between">
            <span className="text-gray-600">Total Tax:</span>
            <span className="font-medium">{format(taxSummary.totalTaxAmount)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Discount:</span>
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value) || 0)}
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
              min="0"
              step="0.01"
            />
          </div>
          
          <div className="border-t pt-3">
            <div className="flex justify-between text-lg font-semibold">
              <span>Total Amount:</span>
              <span>{format(totalAmount)}</span>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {gstService.amountInWords(totalAmount)}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-3">
          <button
            onClick={() => setShowInvoicePreview(true)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Preview
          </button>
          
          <button
            onClick={() => handleExport('pdf')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Download className="h-4 w-4 mr-2 inline" />
            Export
          </button>
        </div>
        
        <button
          onClick={handleGenerateInvoice}
          disabled={isGenerating || !customerName.trim()}
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? 'Generating...' : 'Generate Invoice'}
        </button>
      </div>

      {/* Invoice Preview Modal */}
      {showInvoicePreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Invoice Preview</h3>
              <button
                onClick={() => setShowInvoicePreview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            {/* Invoice content would go here */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-600">
                Invoice preview content would be displayed here...
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={handlePrint}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Printer className="h-4 w-4 mr-2 inline" />
                Print
              </button>
              <button
                onClick={handleEmail}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Mail className="h-4 w-4 mr-2 inline" />
                Email
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2 inline" />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
