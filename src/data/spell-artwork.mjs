// Spell artwork is independent of the Google Sheets spell statistics.
// Each spell can have many images and one deliberately chosen default.
// The artwork's credit travels with that image when the default changes.
import publishedArtwork from './managed-spell-artwork.json' with {type:'json'};

const handAssignedArtwork=Object.freeze({
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


// Managed illustrations are published from the Artwork Registry spreadsheet.
// Keep curated illustrations, including Jade's first Earth Bolt drawing, intact
// until a managed record with the SAME artwork ID replaces that exact entry.
export const spellArtwork=Object.freeze(Object.fromEntries(
  [...new Set([...Object.keys(handAssignedArtwork),...Object.keys(publishedArtwork)])].map(spellId=>{
    const hand=handAssignedArtwork[spellId]||{images:[]};
    const managed=publishedArtwork[spellId]||{images:[]};
    const byId=new Map(hand.images.map(image=>[image.id,image]));
    for(const image of managed.images||[])byId.set(image.id,image);
    const images=[...byId.values()].sort((a,b)=>
      (a.displayOrder??9999)-(b.displayOrder??9999)||(a.id||'').localeCompare(b.id||'')
    );
    const preferred=managed.defaultId||hand.defaultId;
    const defaultId=images.some(x=>x.id===preferred)?preferred:images[0]?.id;
    return [spellId,{defaultId,images}];
  })
));
