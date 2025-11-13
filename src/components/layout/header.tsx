'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { CheckinDropdown } from '@/components/rewards/checkin-dropdown';
import { LanguageSwitcher } from '@/components/widget/language-switcher';
import { routing } from '@/i18n/routing';
import { useAuthStore } from '@/store/auth-store';
import {
  FileSpreadsheet,
  Image as ImageIcon,
  LogOut,
  Menu,
  Sparkles,
  User,
  Video,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { useState } from 'react';

export function Header() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const { user, isAuthenticated, signOut } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  const navItems = [
    {
      title: t('generationTools'),
      items: [
        {
          title: t('imageGeneration'),
          href: '/image-generation',
          description: t('imageGenerationDesc'),
          icon: ImageIcon,
        },
        {
          title: t('videoGeneration'),
          href: '/video-generation',
          description: t('videoGenerationDesc'),
          icon: Video,
        },
        {
          title: t('batchImageGeneration'),
          href: '/batch-image-generation',
          description: t('batchImageGenerationDesc'),
          icon: FileSpreadsheet,
        },
        {
          title: t('batchVideoGeneration'),
          href: '/batch-video-generation',
          description: t('batchVideoGenerationDesc'),
          icon: FileSpreadsheet,
        },
      ],
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200/50 bg-white/80 backdrop-blur-apple supports-[backdrop-filter]:bg-white/60 dark:border-gray-800/50 dark:bg-gray-900/80 dark:supports-[backdrop-filter]:bg-gray-900/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <img
            src="/brandlogo5transb.png"
            alt="Viecom Logo"
            style={{ height: '56px', width: '210px', objectFit: 'contain' }}
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <NavigationMenu>
            <NavigationMenuList>
              {navItems.map((item) => (
                <NavigationMenuItem key={item.title}>
                  <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                      {item.items.map((subItem) => (
                        <li key={subItem.title}>
                          <NavigationMenuLink asChild>
                            <Link
                              href={subItem.href}
                              className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                            >
                              <div className="flex items-center space-x-2">
                                <subItem.icon className="h-4 w-4" />
                                <div className="text-sm font-medium leading-none">
                                  {subItem.title}
                                </div>
                              </div>
                              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                {subItem.description}
                              </p>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          <Link
            href="/assets"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              pathname?.includes('/assets') ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            {t('assets')}
          </Link>
          <Link
            href="/brand-analysis"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              pathname?.includes('/brand-analysis') ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            {t('brandAnalysis')}
          </Link>
        </nav>

        {/* User Menu / Auth Buttons */}
        <div className="flex items-center space-x-4">
          {isAuthenticated && user ? (
            <>
              <CheckinDropdown />
              <LanguageSwitcher />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                    <Avatar className="h-10 w-10 border-2 border-purple-500">
                      <AvatarImage src={user.image || ''} alt={user.name || ''} className="rounded-full" />
                      <AvatarFallback className="bg-purple-600 text-white rounded-full">
                        {user.name?.charAt(0).toUpperCase() || <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">{t('dashboard')}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <LanguageSwitcher />
              <div className="flex items-center space-x-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    {t('login')}
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">{t('signup')}</Button>
                </Link>
              </div>
            </>
          )}

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="border-t md:hidden">
          <div className="container py-4 space-y-2">
            {navItems[0]?.items.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-accent"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </Link>
            ))}
            <Link
              href="/assets"
              className="block px-3 py-2 rounded-md hover:bg-accent"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {t('assets')}
            </Link>
            <Link
              href="/brand-analysis"
              className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-accent"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Sparkles className="h-4 w-4" />
              <span>{t('brandAnalysis')}</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
