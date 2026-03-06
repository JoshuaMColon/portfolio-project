/*=============== SHOW MENU ===============*/
const navMenu = document.getElementById('nav-menu'),
      navToggle = document.getElementById('nav-toggle'),
      navClose = document.getElementById('nav-close')

/*======= MENU SHOW =======*/
/* Validate if constant exists */
if(navToggle){
    navToggle.addEventListener('click', () =>{
        navMenu.classList.add('show-menu')
    })
}

/*======= MENU HIDDEN ======*/
/* Validate if constant exists */
if(navClose){
    navClose.addEventListener('click', () =>{
        navMenu.classList.remove('show-menu')
    })
}

/*=============== REMOVE MENU MOBILE ===============*/
const navLink = document.querySelectorAll('.nav_link')

const linkAction = () =>{
    const navMenu = document.getElementById('nav-menu')
    // When we click on each nav_link, we remove the show-menu class
    navMenu.classList.remove('show-menu')
}

navLink.forEach(n => n.addEventListener('click', linkAction))

/*=============== SWIPER PROJECTS ===============*/
    var swiperProjects = new Swiper(".projects_container", {
      loop: true,
      spaceBetween: 24,
      effect: "cube",
      grabCursor: true,
      mousewheel: true,
      cubeEffect: {
        shadow: true,
        slideShadows: true,
        shadowOffset: 20,
        shadowScale: 0.94,
      },
      keyboard: {
        enabled: true,
      },
      pagination: {
        el: ".swiper-pagination",
        clickable: true,
      },
      breakpoints: {
        1200: {
          slidesPerView: 2,
          spaceBetween: -56,
        },
      },
    });

/*=============== SWIPER TESTIMONIAL ===============*/
var swiperTestimonial = new Swiper(".testimonial_container", {
      grabCursor: true,
      pagination: {
        el: ".swiper-pagination",
        dynamicBullets: true,
        clickable: true,
    },
});

/*=============== EMAIL JS ===============*/
const contactForm =  document.getElementById('contact-form'),
      contactName = document.getElementById('contact-name'),
      contactEmail = document.getElementById('contact-email'),
      contactProject = document.getElementById('contact-project');
      contactMessage = document.getElementById('contact-message');

const sendEmail = (e) => {
    e.preventDefault();

    // Check if the field has a value
    if(contactName.value === '' || contactEmail.value === '' || contactProject.value) {
        // Add and remove color
        contactMessage.classList.remove('color-blue');
        contactMessage.classList.add('color-red');

        // Show message
        contactMessage.textContent = 'Write all the input fields 📧';
}else{
    // serviceID - templateID - #form - publicKey
    emailjs.sendForm('service_b9vhgrg','template_6f0u49','#contact-form', 'ImLjIYOOHkAeZtYWM')
        .then(() => {
            // Show message and color
            contactMessage.classList.add('color-blue');
            contactMessage.textContent = 'Message sent ✅';

            // Remove message after five seconds
            setTimeout(() => {
                contactMessage.textContent = '';
            }, 5000);
          }, (error) => {
              alert('OOPS! SOMETHING HAS FAILED...', error);
          });

        // To clear the input field
        contactName.value = '';
        contactEmail.value = '';
        contactProject.value = '';
    }

};
contactForm.addEventListener('submit', sendEmail);


/*=============== SCROLL SECTIONS ACTIVE LINK ===============*/


/*=============== SHOW SCROLL UP ===============*/ 


/*=============== DARK LIGHT THEME ===============*/ 


/*=============== CHANGE BACKGROUND HEADER ===============*/
const scrollHeader = () =>{
    const header = document.getElementById('header')
    // When the scroll is greater than 50 viewport height, add the scroll-header class to the header tag
    this.scrollY >= 50 ? header.classList.add('scroll-header')
                       : header.classList.remove('scroll-header')
}

/*=============== SCROLL REVEAL ANIMATION ===============*/
