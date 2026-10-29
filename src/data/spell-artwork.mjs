// Spell artwork is independent of the Google Sheets spell statistics.
// Each spell can have many images and one deliberately chosen default.
// The artwork's credit travels with that image when the default changes.
export const spellArtwork=Object.freeze({
  'evocation-earth-bolt': {
    defaultId:'jade-saserna-2026',
    images:[
      {
        id:'jade-saserna-2026',
        src:'art/spells/earth-bolt-jade-saserna.webp',
        title:'Earth Bolt',
        artist:'Jade Saserna',
        alt:'A hand-drawn spellcaster in purple projecting a swirling brown and green earth bolt under a blue sky.'
      }
    ]
  }
});
