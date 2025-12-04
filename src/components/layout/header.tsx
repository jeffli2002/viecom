'use client';

import { CheckinDropdown } from '@/components/rewards/checkin-dropdown';
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
import { Link, usePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { useAuthStore } from '@/store/auth-store';
import {
  BookOpen,
  FileSpreadsheet,
  Image as ImageIcon,
  LogOut,
  Menu,
  Moon,
  ShoppingBag,
  Sparkles,
  Sun,
  User,
  Video,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

export function Header() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const { user, isAuthenticated, signOut } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

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
        {
          title: t('brandAnalysis'),
          href: '/brand-analysis',
          description: t('brandAnalysisDesc'),
          icon: Sparkles,
        },
      ],
    },
    {
      title: t('learn'),
      items: [
        {
          title: t('documentation'),
          href: '/docs',
          description: t('documentationDesc'),
          icon: BookOpen,
        },
        {
          title: t('imageToVideoAI'),
          href: '/image-to-video-ai',
          description: t('imageToVideoAIDesc'),
          icon: Video,
        },
        {
          title: t('freeAIVideoGenerator'),
          href: '/ai-video-generator-free',
          description: t('freeAIVideoGeneratorDesc'),
          icon: Sparkles,
        },
        {
          title: t('videoEnhancer'),
          href: '/video-enhancer-ai',
          description: t('videoEnhancerDesc'),
          icon: Sparkles,
        },
        {
          title: t('nanoBananaPro'),
          href: '/models/nano-banana',
          description: t('nanoBananaProDesc'),
          icon: Sparkles,
        },
      ],
    },
    {
      title: t('solutions'),
      items: [
        {
          title: t('amazonSolutions'),
          href: '/solutions/amazon',
          description: t('amazonSolutionsDesc'),
          icon: ShoppingBag,
        },
        {
          title: t('tiktokSolutions'),
          href: '/solutions/tiktok',
          description: t('tiktokSolutionsDesc'),
          icon: Video,
        },
        {
          title: t('shopifySolutions'),
          href: '/solutions/shopify',
          description: t('shopifySolutionsDesc'),
          icon: ShoppingBag,
        },
      ],
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/50 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:border-white/10 dark:bg-slate-900/80 dark:supports-[backdrop-filter]:bg-slate-900/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <img
            src="/ViecomLogoV6.png"
            alt="Viecom Logo"
            style={{ height: '56px', width: '210px', objectFit: 'contain' }}
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6" suppressHydrationWarning>
          <NavigationMenu>
            <NavigationMenuList>
              {navItems.map((item) => (
                <NavigationMenuItem key={item.title}>
                  <NavigationMenuTrigger className="text-slate-600 dark:text-slate-300">
                    {item.title}
                  </NavigationMenuTrigger>
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
            className={`text-sm font-medium transition-colors hover:text-teal-500 dark:hover:text-white ${
              pathname?.includes('/assets') ? 'text-teal-500' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            {t('assets')}
          </Link>
          <Link
            href="/pricing"
            className={`text-sm font-medium transition-colors hover:text-teal-500 dark:hover:text-white ${
              pathname?.includes('/pricing')
                ? 'text-teal-500'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            {t('pricing')}
          </Link>
        </nav>

        {/* User Menu / Auth Buttons */}
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          {isAuthenticated && user ? (
            <>
              <CheckinDropdown />
              <LanguageSwitcher />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full p-0 !bg-transparent hover:!bg-transparent dark:!bg-transparent dark:hover:!bg-transparent focus:!bg-transparent active:!bg-transparent"
                    style={{ backgroundColor: 'transparent' }}
                  >
                    <Avatar className="h-10 w-10 avatar-teal z-10 relative bg-transparent">
                      <AvatarImage
                        src={user.image || ''}
                        alt={user.name || ''}
                        className="rounded-full !bg-transparent"
                        style={{ backgroundColor: 'transparent' }}
                      />
                      <AvatarFallback
                        className="text-white rounded-full avatar-teal-fallback header-avatar-fallback"
                        data-header-avatar="true"
                      >
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
                    <Link href="/referrals">{t('referrals')}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">{t('settings')}</Link>
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
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="text-slate-600 dark:text-slate-300"
                >
                  <Link href="/login">{t('login')}</Link>
                </Button>
                <Button
                  size="sm"
                  asChild
                  className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90"
                >
                  <Link href="/signup">{t('signup')}</Link>
                </Button>
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
          <div className="container py-4 space-y-4">
            {/* Generation Tools */}
            <div>
              <h3 className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase">{t('generationTools')}</h3>
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
            </div>
            {/* Learn */}
            <div>
              <h3 className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase">{t('learn')}</h3>
              {navItems[1]?.items.map((item) => (
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
            </div>
            {/* Solutions */}
            {navItems[2] && (
              <div>
                <h3 className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase">{t('solutions')}</h3>
                {navItems[2]?.items.map((item) => (
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
              </div>
            )}
            <Link
              href="/assets"
              className="block px-3 py-2 rounded-md hover:bg-accent"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {t('assets')}
            </Link>
            <Link
              href="/pricing"
              className="block px-3 py-2 rounded-md hover:bg-accent"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {t('pricing')}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
