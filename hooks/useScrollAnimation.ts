import { useEffect } from 'react';

export const useScrollAnimation = () => {
  useEffect(() => {
    // Scroll progress bar
    const updateScrollProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      
      const progressBar = document.querySelector('.scroll-progress') as HTMLElement;
      if (progressBar) {
        progressBar.style.width = scrollPercent + '%';
      }
    };

    // Reveal elements on scroll with Intersection Observer
    const revealElements = () => {
      const reveals = document.querySelectorAll('.reveal');
      
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      });

      reveals.forEach(reveal => observer.observe(reveal));
    };

    // Reveal stagger elements
    const revealStaggerElements = () => {
      const reveals = document.querySelectorAll('.reveal-stagger');
      
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '0px 0px -30px 0px'
      });

      reveals.forEach(reveal => observer.observe(reveal));
    };

    // Event listeners
    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    
    // Initialize animations
    revealElements();
    revealStaggerElements();
    updateScrollProgress();

    return () => {
      window.removeEventListener('scroll', updateScrollProgress);
    };
  }, []);
};
