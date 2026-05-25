fetch('https://smart-store-ai-two.vercel.app/')
  .then(r=>r.text())
  .then(html=>{ 
    const match = html.match(/src="(\/assets\/index-[^"]+\.js)"/);
    if(match){ 
      fetch('https://smart-store-ai-two.vercel.app'+match[1])
        .then(r=>r.text())
        .then(js=>{ 
          console.log('Contains localhost:5000? ' + js.includes('localhost:5000')); 
          console.log('Contains render URL? ' + js.includes('smartstore-ai-1.onrender.com')); 
        }); 
    } else { console.log('no match', html.slice(0, 500)); }
  });
