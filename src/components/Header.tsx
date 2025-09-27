import iconDark from '@/icon-dark.png';
import iconLight from '@/icon-light.png';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, Menu } from 'lucide-react';
import { PropsWithChildren, ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from 'theme-o-rama';
import { TopNav } from './Nav';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';

const headerPaginationVariants = {
  enter: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20, transition: { duration: 0.15 } },
};

export default function Header(
  props: PropsWithChildren<{
    title: string | ReactNode;
    back?: () => void;
    mobileActionItems?: ReactNode;
    children?: ReactNode;
    paginationControls?: ReactNode;
    alwaysShowChildren?: boolean;
    style?: React.CSSProperties;
  }>,
) {
  const navigate = useNavigate();
  const location = useLocation();
  const hasBackButton = props.back || location.pathname.split('/').length > 2;

  const { currentTheme } = useTheme();

  return (
    <header
      className='flex items-center gap-4 px-4 md:px-6 sticky top-0 z-10 pt-2'
      role='banner'
      style={props.style}
    >
      <Sheet>
        {hasBackButton ? (
          <Button
            variant='outline'
            size='icon'
            onClick={() => (props.back ? props.back() : navigate(-1))}
            className='md:hidden text-muted-foreground flex-shrink-0'
            aria-label='Back'
          >
            <ChevronLeft className='h-5 w-5 pb' aria-hidden='true' />
          </Button>
        ) : (
          <SheetTrigger asChild>
            <Button
              variant='outline'
              size='icon'
              className='shrink-0 md:hidden'
              aria-label='Toggle navigation menu'
              aria-expanded='false'
              aria-haspopup='dialog'
            >
              <Menu className='h-5 w-5' aria-hidden='true' />
            </Button>
          </SheetTrigger>
        )}
        <SheetContent
          side='left'
          isMobile={false}
          className={`flex flex-col p-0 border-0 ${currentTheme?.backgroundImage ? 'bg-transparent' : ''}`}
          role='dialog'
          aria-label='Navigation menu'
          style={{
            marginLeft: '-8px',
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
            ...(currentTheme?.backgroundImage && {
              backgroundImage: `url(${currentTheme.backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundAttachment: 'scroll',
              backgroundColor: 'transparent',
              transform: 'translateZ(0)',
              willChange: 'transform',
            }),
          }}
        >
          <div
            className={`flex flex-col h-full p-6 ${currentTheme?.sidebar ? '' : 'bg-muted/40'}`}
            style={
              currentTheme?.sidebar
                ? {
                    borderRight: '1px solid var(--sidebar-border)',
                    background: 'var(--sidebar-background)',
                    backdropFilter: 'var(--sidebar-backdrop-filter)',
                    WebkitBackdropFilter:
                      'var(--sidebar-backdrop-filter-webkit)',
                  }
                : {}
            }
          >
            <div className='mt-4'>
              <Link
                to='/'
                className='flex items-center gap-2 font-semibold font-heading'
                aria-label='Go to home'
              >
                <img
                  src={
                    currentTheme?.mostLike === 'light' ? iconDark : iconLight
                  }
                  className='h-6 w-6'
                  alt='Theme icon'
                  aria-hidden='true'
                />

                <span className='text-lg'>Theme-a-roo</span>
              </Link>
            </div>
            <TopNav />
          </div>
        </SheetContent>
      </Sheet>
      <div className='flex-1 md:mt-1 flex items-center md:block'>
        <div className={`${!hasBackButton ? 'invisible' : ''}`}>
          <Button
            variant='link'
            size='sm'
            onClick={() => (props.back ? props.back() : navigate(-1))}
            className='hidden md:flex px-0 text-muted-foreground'
          >
            <ChevronLeft className='h-4 w-4 mr-1' aria-hidden='true' />
            Back
          </Button>
        </div>
        <div className='flex-1 flex justify-between items-center gap-4 md:h-8 md:my-1'>
          <div className='flex items-center gap-4'>
            <h1 className='text-xl font-bold tracking-tight md:text-3xl font-heading truncate'>
              {props.title}
            </h1>
            <AnimatePresence mode='wait'>
              {props.paginationControls && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={headerPaginationVariants.enter}
                  exit={headerPaginationVariants.exit}
                  className='ml-4'
                >
                  {props.paginationControls}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className='flex items-center gap-2'>
            <div className={props.alwaysShowChildren ? '' : 'hidden md:block'}>
              {props.children}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
