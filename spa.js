document.addEventListener('DOMContentLoaded', () => {
  const navItems = document.querySelectorAll('.bottom-nav .nav-item');
  const views = document.querySelectorAll('.view');

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Remove active from all nav items and views
      navItems.forEach(nav => nav.classList.remove('active'));
      views.forEach(view => view.classList.remove('active'));
      
      // Add active to clicked nav item
      item.classList.add('active');
      
      // Show corresponding view
      const targetId = item.getAttribute('data-target');
      document.getElementById(targetId).classList.add('active');
      
      // Scroll to top
      window.scrollTo(0,0);
      
      // Trigger map resize if map view is opened
      if(targetId === 'view-driver' && typeof L !== 'undefined' && map) {
        setTimeout(() => map.invalidateSize(), 100);
      }
    });
  });
});
