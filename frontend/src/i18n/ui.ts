// Central translation dictionary.
// Add new keys here whenever you add new UI text — both `en` and `sr` should
// always have matching keys so nothing is ever left untranslated.

export const languages = {
  en: 'English',
  sr: 'Srpski',
};

export const defaultLang = 'en';

export const ui = {
  en: {
    'nav.home': 'Home',
    'nav.recipes': 'Recipes',
    'nav.blog': 'Blog',
    'nav.about': 'About Me',
    'nav.contact': 'Contact',

    'home.title': 'Šećerless — Recipes worth sharing. 🍲',
    'home.subtitle':
      "What started as sugar-free treats has grown into all my favorite recipes — from my kitchen to yours, plus stories, tips, and a place to ask questions or collaborate.",
    'home.cta': 'Browse Recipes',
    'home.topRecipes': '🔥 Top Recipes',
    'home.sliderNote': '(This will become a proper animated carousel React island in Phase 8 👀)',

    'about.title': 'About Me',
    'about.p1':
      "Hi, I'm [Your Name]! Šećerless started out as a page for sugar-free desserts on Instagram — but lately I've been cooking (and sharing) everything, from full dinners to family classics. Now it's all getting a proper home here, with the full stories, exact measurements, and step-by-step instructions that don't always fit in a caption.",
    'about.p2': 'This space is about real home cooking in all its forms: sugar-free treats, comfort food, family recipes, and the occasional kitchen experiment. Feel free to reach out on the',
    'about.p2Link': 'contact page',
    'about.p2End': 'with questions or collaboration ideas.',

    'contact.title': 'Questions & Collaboration',
    'contact.subtitle': 'Got a question about a recipe, or want to collaborate? Send a message below.',
    'contact.name': 'Name',
    'contact.namePlaceholder': 'Your name',
    'contact.email': 'Email',
    'contact.message': 'Message',
    'contact.messagePlaceholder': 'Your question or idea...',
    'contact.submit': 'Send Message',

    'recipes.title': 'All Recipes',
    'recipes.save': '❤️ Save to Favorites',
    'recipes.ingredients': 'Ingredients',
    'recipes.steps': 'Steps',

    'blog.title': 'Blog',

    'login.title': 'Log In',
    'login.noAccount': "Don't have an account?",
    'login.signup': 'Sign up',
    'login.email': 'Email',
    'login.password': 'Password',
    'login.submit': 'Log In',

    'register.title': 'Create Account',
    'register.haveAccount': 'Already have an account?',
    'register.login': 'Log in',
    'register.name': 'Name',
    'register.surname': 'Surname',
    'register.email': 'Email',
    'register.password': 'Password',
    'register.submit': 'Sign Up',

    'favorites.title': 'My Favorites',
    'favorites.empty': "Log in and start saving recipes — they'll show up here. (Phase 7 feature)",

    'admin.title': 'Admin Dashboard',
    'admin.description': 'This area will let you create/edit recipes and blog posts. Protected by admin-only auth — built in Phase 5.',

    'footer.tagline': 'recipes, stories & collaboration',
    'footer.builtWith': 'Built with Astro, React & Tailwind',

    // Profile menu (avatar dropdown)
    'profile.login': 'Log In',
    'profile.signup': 'Sign Up',
    'profile.myProfile': 'My Profile',
    'profile.favorites': 'Favorites',
    'profile.language': 'Language',
    'profile.theme': 'Theme',
    'profile.themeLight': 'Light',
    'profile.themeDark': 'Dark',
    'profile.logout': 'Log Out',
    'profile.guest': 'Guest',
    'profile.title': 'My Profile',
    'profile.firstName': 'First Name',
    'profile.lastName': 'Last Name',
    'profile.pictureUrl': 'Profile Picture URL',
    'profile.save': 'Save Changes',
    'profile.saved': 'Saved!',
  },
  sr: {
    'nav.home': 'Početna',
    'nav.recipes': 'Recepti',
    'nav.blog': 'Blog',
    'nav.about': 'O meni',
    'nav.contact': 'Kontakt',

    'home.title': 'Šećerless — Recepti vredni deljenja. 🍲',
    'home.subtitle':
      'Sve je počelo kao stranica za deserte bez šećera, a preraslo je u sve moje omiljene recepte — iz moje kuhinje za vašu, uz priče, savete i mesto gde možete da postavite pitanja ili predložite saradnju.',
    'home.cta': 'Pogledaj recepte',
    'home.topRecipes': '🔥 Najbolji recepti',
    'home.sliderNote': '(Ovo će postati pravi animirani slajder u Fazi 8 👀)',

    'about.title': 'O meni',
    'about.p1':
      'Zdravo, ja sam [Vaše Ime]! Šećerless je počeo kao Instagram stranica za deserte bez šećera — ali u poslednje vreme kuvam (i delim) baš sve, od kompletnih večera do porodičnih klasika. Sada sve to dobija pravi dom ovde, sa kompletnim pričama, tačnim merama i koracima koji ne staju uvek u opis fotografije.',
    'about.p2': 'Ovaj prostor je posvećen pravom domaćem kuvanju u svim oblicima: deserti bez šećera, udobna hrana, porodični recepti i pokoji eksperiment u kuhinji. Slobodno me kontaktirajte preko',
    'about.p2Link': 'kontakt strane',
    'about.p2End': 'sa pitanjima ili idejama za saradnju.',

    'contact.title': 'Pitanja i saradnja',
    'contact.subtitle': 'Imate pitanje o receptu ili želite da sarađujemo? Pošaljite poruku ispod.',
    'contact.name': 'Ime',
    'contact.namePlaceholder': 'Vaše ime',
    'contact.email': 'Email',
    'contact.message': 'Poruka',
    'contact.messagePlaceholder': 'Vaše pitanje ili ideja...',
    'contact.submit': 'Pošalji poruku',

    'recipes.title': 'Svi recepti',
    'recipes.save': '❤️ Sačuvaj u omiljene',
    'recipes.ingredients': 'Sastojci',
    'recipes.steps': 'Koraci',

    'blog.title': 'Blog',

    'login.title': 'Prijava',
    'login.noAccount': 'Nemate nalog?',
    'login.signup': 'Registrujte se',
    'login.email': 'Email',
    'login.password': 'Lozinka',
    'login.submit': 'Prijavi se',

    'register.title': 'Napravi nalog',
    'register.haveAccount': 'Već imate nalog?',
    'register.login': 'Prijavite se',
    'register.name': 'Ime',
    'register.surname': 'Prezime',
    'register.email': 'Email',
    'register.password': 'Lozinka',
    'register.submit': 'Registruj se',

    'favorites.title': 'Moji omiljeni recepti',
    'favorites.empty': 'Prijavite se i počnite da čuvate recepte — pojaviće se ovde. (Funkcija u Fazi 7)',

    'admin.title': 'Admin panel',
    'admin.description': 'Ovde ćete moći da kreirate/menjate recepte i blog objave. Zaštićeno admin prijavom — gradimo u Fazi 5.',

    'footer.tagline': 'recepti, priče i saradnja',
    'footer.builtWith': 'Napravljeno pomoću Astro, React i Tailwind',

    // Profile menu (avatar dropdown)
    'profile.login': 'Prijava',
    'profile.signup': 'Registracija',
    'profile.myProfile': 'Moj profil',
    'profile.favorites': 'Omiljeno',
    'profile.language': 'Jezik',
    'profile.theme': 'Tema',
    'profile.themeLight': 'Svetla',
    'profile.themeDark': 'Tamna',
    'profile.logout': 'Odjava',
    'profile.guest': 'Gost',
    'profile.title': 'Moj profil',
    'profile.firstName': 'Ime',
    'profile.lastName': 'Prezime',
    'profile.pictureUrl': 'URL profilne slike',
    'profile.save': 'Sačuvaj izmene',
    'profile.saved': 'Sačuvano!',
  },
} as const;

