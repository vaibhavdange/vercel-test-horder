import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/database/prisma";
import { SearchResult } from "../../../hooks/use-global-search";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    const searchTerm = query.toLowerCase();
    const results: SearchResult[] = [];

    // Search products
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm } },
          { description: { contains: searchTerm } },
          { barcode: { contains: searchTerm } },
        ],
        isActive: true,
      },
      include: {
        category: {
          select: { name: true },
        },
      },
      take: Math.ceil(limit / 8),
    });

    products.forEach((product) => {
      results.push({
        id: product.id,
        type: 'product',
        title: product.name,
        subtitle: product.category?.name || undefined,
        description: product.description || undefined,
        url: `/menu`,
        icon: '📦',
        highlightId: `product-${product.id}`,
      });
    });

    // Search recipes
    const recipes = await prisma.recipe.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm } },
          { description: { contains: searchTerm } },
        ],
        isActive: true,
      },
      include: {
        product: {
          select: { name: true },
        },
      },
      take: Math.ceil(limit / 8),
    });

    recipes.forEach((recipe) => {
      results.push({
        id: recipe.id,
        type: 'recipe',
        title: recipe.name,
        subtitle: `Recipe for ${recipe.product.name}`,
        description: recipe.description || undefined,
        url: `/recipes`,
        icon: '📖',
        highlightId: `recipe-${recipe.id}`,
      });
    });

    // Search stock items
    const stockItems = await prisma.stockItem.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm } },
          { description: { contains: searchTerm } },
          { supplier: { contains: searchTerm } },
        ],
        isActive: true,
      },
      include: {
        category: {
          select: { name: true },
        },
      },
      take: Math.ceil(limit / 8),
    });

    stockItems.forEach((stockItem) => {
      results.push({
        id: stockItem.id,
        type: 'ingredient',
        title: stockItem.name,
        subtitle: stockItem.category?.name || undefined,
        description: `${stockItem.stockQuantity} ${stockItem.unit} available`,
        url: `/inventory`,
        icon: '🥬',
        highlightId: `ingredient-${stockItem.id}`,
      });
    });

    // Search categories
    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm } },
          { description: { contains: searchTerm } },
        ],
      },
      take: Math.ceil(limit / 8),
    });

    categories.forEach((category) => {
      results.push({
        id: category.id,
        type: 'category',
        title: category.name,
        subtitle: category.description || undefined,
        description: `Category`,
        url: `/menu`,
        icon: '🏷️',
        highlightId: `category-${category.id}`,
      });
    });

    // Search orders
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { orderNumber: { contains: searchTerm } },
          { customerName: { contains: searchTerm } },
          { customerPhone: { contains: searchTerm } },
        ],
      },
      take: Math.ceil(limit / 8),
    });

    orders.forEach((order) => {
      results.push({
        id: order.id,
        type: 'order',
        title: `Order #${order.orderNumber}`,
        subtitle: order.customerName || order.customerPhone || undefined,
        description: `${order.orderType} - ${order.status}`,
        url: `/orders`,
        icon: '📋',
        highlightId: `order-${order.id}`,
      });
    });

    // Search customers
    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm } },
          { email: { contains: searchTerm } },
          { phone: { contains: searchTerm } },
        ],
      },
      take: Math.ceil(limit / 8),
    });

    customers.forEach((customer) => {
      results.push({
        id: customer.id,
        type: 'customer',
        title: customer.name,
        subtitle: customer.email || customer.phone || undefined,
        description: `Customer`,
        url: `/customers`,
        icon: '👤',
        highlightId: `customer-${customer.id}`,
      });
    });

    // Search staff
    const staffMembers = await prisma.staff.findMany({
      where: {
        OR: [
          { employeeId: { contains: searchTerm } },
        ],
      },
      include: {
        user: {
          select: { fullName: true, email: true },
        },
      },
      take: Math.ceil(limit / 8),
    });

    staffMembers.forEach((staffMember) => {
      results.push({
        id: staffMember.id,
        type: 'staff',
        title: staffMember.user.fullName,
        subtitle: staffMember.employeeId,
        description: staffMember.user.email || undefined,
        url: `/staff`,
        icon: '👨‍💼',
        highlightId: `staff-${staffMember.id}`,
      });
    });

    // Search tables
    const tables = await prisma.table.findMany({
      where: {
        OR: [
          { tableNumber: { contains: searchTerm } },
        ],
      },
      include: {
        area: {
          select: { name: true },
          include: {
            floor: {
              select: { name: true },
            },
          },
        },
      },
      take: Math.ceil(limit / 8),
    });

    tables.forEach((table) => {
      results.push({
        id: table.id,
        type: 'table',
        title: `Table ${table.tableNumber}`,
        subtitle: `${table.area.name} - ${table.area.floor.name}`,
        description: `Capacity: ${table.capacity} - Status: ${table.status}`,
        url: `/tables`,
        icon: '🪑',
        highlightId: `table-${table.id}`,
      });
    });

    // Search tax categories
    const taxCategories = await prisma.taxCategory.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm } },
          { description: { contains: searchTerm } },
        ],
        isActive: true,
      },
      take: Math.ceil(limit / 8),
    });

    taxCategories.forEach((taxCategory) => {
      results.push({
        id: taxCategory.id,
        type: 'tax-category',
        title: taxCategory.name,
        subtitle: `${(taxCategory.taxRate * 100).toFixed(1)}% tax rate`,
        description: taxCategory.description || undefined,
        url: `/settings/tax-categories`,
        icon: '💰',
        highlightId: `tax-category-${taxCategory.id}`,
      });
    });

    // Search areas
    const areas = await prisma.area.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm } },
          { description: { contains: searchTerm } },
        ],
      },
      include: {
        floor: {
          select: { name: true },
        },
      },
      take: Math.ceil(limit / 8),
    });

    areas.forEach((area) => {
      results.push({
        id: area.id,
        type: 'area',
        title: area.name,
        subtitle: `Floor: ${area.floor.name}`,
        description: area.description || undefined,
        url: `/tables`,
        icon: '🏢',
        highlightId: `area-${area.id}`,
      });
    });

    // Search floors
    const floors = await prisma.floor.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm } },
          { description: { contains: searchTerm } },
        ],
      },
      take: Math.ceil(limit / 8),
    });

    floors.forEach((floor) => {
      results.push({
        id: floor.id,
        type: 'floor',
        title: floor.name,
        subtitle: floor.description || undefined,
        description: `Floor`,
        url: `/tables`,
        icon: '🏗️',
        highlightId: `floor-${floor.id}`,
      });
    });

    // Search staff attendance
    const attendanceRecords = await prisma.staffAttendance.findMany({
      where: {
        OR: [
          { notes: { contains: searchTerm } },
        ],
      },
      include: {
        staff: {
          select: { 
            user: {
              select: { fullName: true }
            }
          },
        },
      },
      take: Math.ceil(limit / 8),
    });

    attendanceRecords.forEach((record) => {
      results.push({
        id: record.id,
        type: 'attendance',
        title: `${record.staff.user.fullName} - ${record.date.toLocaleDateString()}`,
        subtitle: record.date.toLocaleDateString(),
        description: record.notes || undefined,
        url: `/staff`,
        icon: '⏰',
        highlightId: `attendance-${record.id}`,
      });
    });

    // Search billing settings
    const billingSettings = await prisma.billingSettings.findMany({
      where: {
        OR: [
          { key: { contains: searchTerm } },
          { value: { contains: searchTerm } },
          { description: { contains: searchTerm } },
        ],
      },
      take: Math.ceil(limit / 8),
    });

    billingSettings.forEach((setting) => {
      results.push({
        id: setting.id,
        type: 'billing-setting',
        title: setting.key,
        subtitle: setting.description || undefined,
        description: `Billing Setting`,
        url: `/settings/billing`,
        icon: '⚙️',
        highlightId: `billing-setting-${setting.id}`,
      });
    });

    // Return results sorted by relevance (products first, then others)
    const sortedResults = [
      ...results.filter(r => r.type === 'product'),
      ...results.filter(r => r.type !== 'product')
    ].slice(0, limit);

    return NextResponse.json(sortedResults);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
