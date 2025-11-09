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
      title: '生成工具',
      items: [
        {
          title: '图片生成',
          href: '/image-generation',
          description: 'Text-to-Image 和 Image-to-Image',
          icon: ImageIcon,
        },
        {
          title: '视频生成',
          href: '/video-generation',
          description: 'Text-to-Video 和 Image-to-Video',
          icon: Video,
        },
        {
          title: '批量生图',
          href: '/batch-image-generation',
          description: '批量生成图片',
          icon: FileSpreadsheet,
        },
        {
          title: '批量生视频',
          href: '/batch-video-generation',
          description: '批量生成视频',
          icon: FileSpreadsheet,
        },
      ],
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200/50 bg-white/80 backdrop-blur-apple supports-[backdrop-filter]:bg-white/60 dark:border-gray-800/50 dark:bg-gray-900/80 dark:supports-[backdrop-filter]:bg-gray-900/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">Viecom</span>
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
        </nav>

        {/* User Menu / Auth Buttons */}
        <div className="flex items-center space-x-4">
          <LanguageSwitcher />
          {isAuthenticated && user ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  {t('dashboard')}
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.image || ''} alt={user.name || ''} />
                      <AvatarFallback>
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
              资产库
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
