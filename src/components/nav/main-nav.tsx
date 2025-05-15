'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Shield, Search } from 'lucide-react';

const navItems = [
  {
    name: 'PII Detector',
    href: '/',
    icon: Shield,
    description: 'Detect and protect sensitive information in documents'
  },
  {
    name: 'Supplier Risk Search',
    href: '/supplier-risk',
    icon: Search,
    description: 'Search and analyze supplier risk information'
  }
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4 max-w-7xl mx-auto">
        <div className="flex items-center space-x-8">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
} 