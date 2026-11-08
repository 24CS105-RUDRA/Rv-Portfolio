// Original Hinglish jokes, including movie-style riffs rather than long dialogue quotes.
export const banter = {
  roam: [
    'Main character main hoon. Tum bas scroll karo.',
    'POV: intern ko production access mil gaya.',
    'Meri entry late hai. Attitude on time.',
    'Yeh portfolio nahi, mera rented flat hai.',
    'Algorithm bhi bole: bhai, thoda shaant.',
    'Chhota packet. Unlimited bakch***.',
    'Meri biopic ka budget CSS mein khatam ho gaya.',
    'Aaj ka fit: 58 pixels aur full confidence.',
  ],
  corporate: [
    'Salary zero. Expectations CEO wali.',
    'Quick sync? Bhai, main async hi theek hoon.',
    'Circle back karte karte gol ho gaya.',
    'Yeh meeting ek emoji ho sakti thi.',
    'Mera appraisal? Exceeds irritation.',
    'Work-life balance: dono loading pe hain.',
    'Deadline kal thi. Main aaj cute lag raha hoon.',
    'Please find attached: meri bachi hui patience.',
  ],
  poke: [
    'Oye! Mouse hai, doorbell nahi.',
    'Itna poke? Crush hoon kya tera?',
    'Touch grass bolte hain. Touch blob nahi.',
    'Bhai, meri personal space bhi responsive hai.',
    'Click pe click. Productivity ka kya scene hai?',
    'Meri shakal pe attendance mat laga.',
    'F*** around ka free trial chal raha hai.',
    'Tumhara rizz mere hitbox tak hi hai.',
  ],
  dodge: [
    'Pakad ke dikha, keyboard ke khiladi.',
    'Aim tera. Second-hand embarrassment meri.',
    'Seen karke bhaagna meri love language hai.',
    'Main lag nahi kar raha. Tum slow ho.',
    'Catch me outside? Main toh website inside hoon.',
    'Skill issue, jaaneman. Skill issue.',
    'Haath ko aaya, cursor ko na aaya.',
    'Itna chase? LinkedIn pe recruiter ho kya?',
  ],
  warning: [
    'Ab patience ka notice period khatam.',
    'Mera villain arc tumne approve kiya hai.',
    'Bhai, agla click appraisal mein jayega.',
    'Ungli mat kar. Main poora layout hila dunga.',
    'Meri sharafat ko free hosting mat samajh.',
    'Bas kar b***, pixels ki bhi feelings hain.',
    'HR ko bulao. Ya exorcist ko. Jaldi.',
    'Ab background music serious hone wala hai.',
  ],
  takeover: [
    'Picture ka interval khatam. Ab meri entry.',
    'Aaj kuch toh tootega. Mostly typography.',
    'Production access mila. Sanskaar logout.',
    'Tumne poke kiya. Maine ownership le li.',
    'Ab main scroll karunga. Tum popcorn lao.',
    'CEO of s*** getting real, reporting live.',
    'Reel mat banana. Evidence ho jayega.',
    'Yeh mera villain era hai. Brand deal baad mein.',
  ],
  impact: [
    'Yeh heading ab hawa se baatein karegi.',
    'Dekha? Deliverable literally deliver ho gaya.',
    'Thoda sa dust. Thoda sa trust issue.',
    'Corporate restructuring. Structure hi hata diya.',
    'Isko kehte hain aggressive whitespace.',
    'Oops. Design ka situationship khatam.',
    'Ek jump. Poora aesthetic gone. Iconic.',
    'Khatam nahi hua. Particle size mein promote hua.',
  ],
  restore: [
    'Sab wapas. Ab mummy ko mat batana.',
    'Prank tha, bro. Portfolio zinda hai.',
    'Damage reversible. Meri reputation nahi.',
    'Undo kar diya. Therapy tum khud kar lena.',
    'Meeting over. Sab apni jagah baitho.',
    'Sorry nahi bolunga. Restore kar diya na.',
    'Villain arc khatam. Chai break shuru.',
    'Sab theek hai. Bas ego ka backup nahi mila.',
  ],
};

// Every line in a context is used before reshuffling; avoid boundary repeats too.
export function createBanter(random = Math.random) {
  const bags = new Map(), previous = new Map();
  return context => {
    if (!banter[context]) throw new Error(`Unknown Inkling banter context: ${context}`);
    let bag = bags.get(context);
    if (!bag?.length) {
      bag = [...banter[context]];
      for(let i=bag.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}
      if(bag.at(-1)===previous.get(context)) [bag[0],bag[bag.length-1]]=[bag.at(-1),bag[0]];
      bags.set(context,bag);
    }
    const line=bag.pop(); previous.set(context,line); return line;
  };
}
