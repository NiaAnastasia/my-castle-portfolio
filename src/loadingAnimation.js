const dragonAscii = `
                                                                                                    
                                                                                                    
                                                                                                    
                                                                                                    
                                                                                                    
                                                                                                    
                                                                                                    
                                                                                                    
                               .-=:.                                                                
                               .:-▒█@%.                                                             
                                   ████░+                                                           
                                   %█████%.                                                         
                                    ░█████▒%.                                                       
                                 .-%▓███████#:                                                      
                                 =&░██████████&.                                                    
                                    *██████████▒*.                                                  
                                     :@██████████#.                                  -:             
                                      :#██████████░:                              =-#%              
                                       %███████████@ %+: *%=.                .-=+#%░█#- .           
           :+++=        .=====+++-%*=. +███████████-  -**&@█░%%+:=&=.     .+@%░&-:.=:#█@:           
       :*@██████████████████████░░:  :@███████████░  :+▓@@███▓▓█▓▒░@-:-**++ ..        -░#*&@+.:     
     .&▓██████████████████████████&  :--%▒████████%.+░████▒███#+. .-@&-                   :%==+.    
     ==.:****&▒████████████████████░:    %████████#&▓██▓░▓&*%░▒█░%-   +#+=:::::      ..&░&*--%%:    
               +████████████████████▒*-. %█████▓▓█▓███@&&:     :-%:      .--##+#+++=&#%==%%=:.:     
                #██████████████████████▒&%░████▓▒&&▓#+&=                      :.:@%+▓=+    -.       
                *░@@███████████████████████████@*.&:-&.                          :-...              
                    ▒████████████████████████████░&.%░+++..                                         
                    :██████████████████████████#*████░#░##.                                         
                    :░-    -=#▒██████████████@=.+▓@=+▒+..                                           
                    ..        :-@@▒██████*%▓░@▓▓#=.  ..                                             
                                   @██████*&███▓                                                    
                                  %▓██████████▓=                                                    
                                 :&█████████░*:                                                     
                                 :░████#.=░▓=.                                                      
                                 %███@▒.  :@█:                                                      
                                -&██@▓-                                                             
                                .▓██*@.                                                             
                                ▒███░-                                                              
                              :#████=                                                               
       .=*&#░%*..            :░███@-                                                                
       ..  .-+#█░@==     .=-@███▓+                                                                  
               :+#▒█░█@░▓▒███▓#*.                                                                   
                  .--&&&&%--:                                                                       
`;

function getDragonPoints(canvas) {
  const lines = dragonAscii.split("\n");
  const points = [];

  const isMobile = canvas.width < 768;
  const cellW = isMobile ? 4 : 10;
  const cellH = isMobile ? 7 : 16;
  const scale = isMobile ? 0.4 : 1;

  const dragonW = 100 * cellW;
  const dragonH = lines.length * cellH;
  const offsetX = isMobile ? 10 : (canvas.width - dragonW) / 2 - 150;
  const offsetY = (canvas.height - dragonH) / 2;

  for (let row = 0; row < lines.length; row++) {
    for (let col = 0; col < lines[row].length; col++) {
      const ch = lines[row][col];
      if (ch !== " " && ch !== "") {
        points.push({
          tx: offsetX + col * cellW,
          ty: offsetY + row * cellH,
          char: ch,
        });
      }
    }
  }
  return points;
}

export function startDragonAnimation(canvas) {
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const points = getDragonPoints(canvas);

  const particles = points.map((p) => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    tx: p.tx,
    ty: p.ty,
    char: p.char,
    speed: 0.008 + Math.random() * 0.012,
    opacity: 0,
  }));

  let frame = 0;
  let animId;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const isMobile = canvas.width < 768;
    ctx.font = isMobile ? "6px monospace" : "12px monospace";

    particles.forEach((p) => {
      p.x += (p.tx - p.x) * p.speed;
      p.y += (p.ty - p.y) * p.speed;
      if (p.opacity < 1) p.opacity += 0.01;

      const r = Math.floor(201 + Math.random() * 20);
      const g = Math.floor(168 + Math.random() * 20);
      ctx.fillStyle = `rgba(${r}, ${g}, 76, ${p.opacity})`;
      ctx.fillText(p.char, p.x, p.y);
    });

    frame++;
    animId = requestAnimationFrame(draw);
  }

  draw();
  return () => cancelAnimationFrame(animId);
}
