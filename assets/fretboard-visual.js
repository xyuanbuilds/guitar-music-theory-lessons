(function () {
  'use strict';
  var componentScript = document.currentScript;
  if (!document.querySelector('link[data-fretboard-visual-css]')) {
    var componentStyle = document.createElement('link');
    componentStyle.rel = 'stylesheet';
    componentStyle.setAttribute('data-fretboard-visual-css', '');
    componentStyle.href = new URL('fretboard-visual.css?v=2', componentScript.src).href;
    document.head.appendChild(componentStyle);
  }

  function mark(string, fret, finger, note, degree, role) {
    return { string: string, fret: fret, finger: finger, note: note, degree: degree, role: role || 'tone' };
  }
  function card(name, baseFret, fretRows, marks, note, barres) {
    return { name: name, baseFret: baseFret, fretRows: fretRows, marks: marks, note: note || '', barres: barres || [] };
  }
  var ROOT = 'root', TARGET = 'target', COLOR = 'color';

  var cMajor = [
    mark(6,8,1,'C3','1',ROOT), mark(6,10,3,'D3','2'), mark(6,12,4,'E3','3',TARGET),
    mark(5,8,1,'F3','4'), mark(5,10,3,'G3','5',TARGET), mark(5,12,4,'A3','6'),
    mark(4,9,2,'B3','7',COLOR), mark(4,10,3,'C4','1',ROOT)
  ];
  var cCentral = [
    mark(3,5,1,'C4','1',ROOT), mark(3,7,3,'D4','2'), mark(2,5,1,'E4','3',TARGET),
    mark(2,6,2,'F4','4',COLOR), mark(2,8,4,'G4','5',TARGET), mark(1,5,1,'A4','6'),
    mark(1,7,3,'B4','7',COLOR), mark(1,8,4,'C5','1',ROOT)
  ];
  var dDorian = [
    mark(3,7,3,'D4','1',ROOT), mark(2,5,1,'E4','2'), mark(2,6,2,'F4','♭3',TARGET),
    mark(2,8,4,'G4','4'), mark(1,5,1,'A4','5'), mark(1,7,3,'B4','6',COLOR),
    mark(1,8,4,'C5','♭7',TARGET)
  ];
  var gBebop = [
    mark(4,5,1,'G3','1',ROOT), mark(4,7,3,'A3','2'), mark(3,4,1,'B3','3',TARGET),
    mark(3,5,2,'C4','4'), mark(3,7,4,'D4','5',TARGET), mark(2,5,1,'E4','6'),
    mark(2,6,2,'F4','♭7',TARGET), mark(2,7,3,'F#4','7',COLOR), mark(2,8,4,'G4','1',ROOT)
  ];
  var aHarmonic = [
    mark(4,7,3,'A3','1',ROOT), mark(3,4,1,'B3','2'), mark(3,5,2,'C4','♭3'),
    mark(3,7,4,'D4','4'), mark(2,5,1,'E4','5',TARGET), mark(2,6,2,'F4','♭6',COLOR),
    mark(1,4,1,'G#4','7',COLOR), mark(1,5,2,'A4','1',ROOT)
  ];
  var aMelodic = [
    mark(4,7,3,'A3','1',ROOT), mark(3,4,1,'B3','2'), mark(3,5,2,'C4','♭3'),
    mark(3,7,4,'D4','4'), mark(2,5,1,'E4','5'), mark(2,7,3,'F#4','6',COLOR),
    mark(1,4,1,'G#4','7',COLOR), mark(1,5,2,'A4','1',ROOT)
  ];
  var gLydianDominant = [
    mark(4,5,1,'G3','1',ROOT), mark(4,7,3,'A3','2'), mark(3,4,1,'B3','3',TARGET),
    mark(3,6,2,'C#4','♯4',COLOR), mark(3,7,3,'D4','5'), mark(2,5,1,'E4','6'),
    mark(2,6,2,'F4','♭7',TARGET), mark(2,8,4,'G4','1',ROOT)
  ];
  var gAltered = [
    mark(4,5,1,'G3','1',ROOT), mark(4,6,2,'A♭3','♭9',COLOR), mark(4,8,4,'B♭3','♯9',COLOR),
    mark(3,4,1,'B3','3',TARGET), mark(3,6,2,'D♭4','♭5',COLOR), mark(2,4,1,'E♭4','♭13',COLOR),
    mark(2,6,3,'F4','♭7',TARGET), mark(2,8,4,'G4','1',ROOT)
  ];
  var gHalfWhole = [
    mark(4,5,1,'G3','1',ROOT), mark(4,6,2,'A♭3','♭9',COLOR), mark(4,8,4,'B♭3','♯9',COLOR),
    mark(3,4,1,'B3','3',TARGET), mark(3,6,2,'D♭4','♯11',COLOR), mark(3,7,3,'D4','5'),
    mark(2,5,1,'E4','13',COLOR), mark(2,6,2,'F4','♭7',TARGET), mark(2,8,4,'G4','1',ROOT)
  ];

  var PRESETS = {
    'l2-octaves': [
      card('G 的八度链',3,6,[mark(6,3,1,'G2','同名',ROOT),mark(4,5,3,'G3','同名',ROOT),mark(2,8,4,'G4','同名',ROOT)],'依次弹 6弦3品 → 4弦5品 → 2弦8品；每一站都说 G 与八度。'),
      card('C 的八度链',3,6,[mark(5,3,1,'C3','同名',ROOT),mark(3,5,3,'C4','同名',ROOT),mark(1,8,4,'C5','同名',ROOT)],'依次弹 5弦3品 → 3弦5品 → 1弦8品；经过 B 弦边界时多移一品。')
    ],
    'l2-intervals': [
      card('A 小三和弦片段',3,5,[mark(6,5,2,'A2','1',ROOT),mark(5,3,1,'C3','♭3',COLOR),mark(5,7,4,'E3','5',TARGET)],'先弹根音，再弹 ♭3 与 5；不是要求三音同时按住。'),
      card('A 大三和弦片段',3,5,[mark(6,5,2,'A2','1',ROOT),mark(5,4,1,'C#3','3',COLOR),mark(5,7,4,'E3','5',TARGET)],'只把 C3 升到 C#3，听大小三度的差别。')
    ],
    'l2-c-major-position': [card('C 大调一八度 · 8品把位',8,5,cMajor,'按 6弦 → 5弦 → 4弦的顺序上行；圈内数字是建议手指。')],
    'l2-chord-tones': [card('C–D–E 低把位路线',1,3,[mark(2,1,1,'C4','和弦音',TARGET),mark(2,3,3,'D4','经过音',COLOR),mark(1,0,0,'E4','和弦音',TARGET)],'C4 与 E4 可停留；D4 继续走向相邻和弦音。')],
    'l2-voice-triads': [
      card('C · 根位',3,3,[mark(3,5,2,'C4','1',ROOT),mark(2,5,3,'E4','3'),mark(1,3,1,'G4','5')]),
      card('G · 第一转位',3,2,[mark(3,4,2,'B3','3'),mark(2,3,1,'D4','5'),mark(1,3,1,'G4','1',ROOT)],'1指可轻压 2、1 弦 3 品。',[{fret:3,from:2,to:1,finger:1}]),
      card('Am · 第一转位',5,2,[mark(3,5,1,'C4','♭3'),mark(2,5,1,'E4','5'),mark(1,5,1,'A4','1',ROOT)],'用 1 指小横按高音三弦。',[{fret:5,from:3,to:1,finger:1}]),
      card('F · 第二转位',5,2,[mark(3,5,1,'C4','5'),mark(2,6,2,'F4','1',ROOT),mark(1,5,1,'A4','3')],'1指轻压 3、1 弦；先分开确认清楚，再一起响。')
    ],
    'l2-caged': [
      card('C shape · 根音',1,3,[mark(5,3,3,'C3','R',ROOT),mark(2,1,1,'C4','R',ROOT)]),
      card('A shape 区域 · 根音',3,3,[mark(5,3,1,'C3','R',ROOT),mark(3,5,3,'C4','R',ROOT)]),
      card('G shape 区域 · 根音',5,4,[mark(6,8,4,'C3','R',ROOT),mark(3,5,1,'C4','R',ROOT),mark(1,8,4,'C5','R',ROOT)]),
      card('E shape 区域 · 根音',8,3,[mark(6,8,1,'C3','R',ROOT),mark(4,10,3,'C4','R',ROOT),mark(1,8,1,'C5','R',ROOT)]),
      card('D shape 区域 · 根音',10,4,[mark(4,10,1,'C4','R',ROOT),mark(2,13,4,'C5','R',ROOT)])
    ],
    'l2-inversions': [
      card('C 根位 · 1–3–5',3,3,[mark(3,5,2,'C4','1',ROOT),mark(2,5,3,'E4','3'),mark(1,3,1,'G4','5')]),
      card('C 第一转位 · 3–5–1',8,2,[mark(3,9,2,'E4','3'),mark(2,8,1,'G4','5'),mark(1,8,1,'C5','1',ROOT)],'1指可小横按 2、1 弦。',[{fret:8,from:2,to:1,finger:1}]),
      card('C 第二转位 · 5–1–3',12,2,[mark(3,12,1,'G4','5'),mark(2,13,2,'C5','1',ROOT),mark(1,12,1,'E5','3')],'1指轻压 3、1 弦。')
    ],
    'l2-layers': [
      card('第 1 层 · C 琶音',8,5,cMajor.filter(function(x){return ['1','3','5'].indexOf(x.degree)>=0;}),'先看见 1、3、5，再扩张。'),
      card('第 2 层 · C 大调五声',8,5,cMajor.filter(function(x){return ['1','2','3','5','6'].indexOf(x.degree)>=0;}),'在琶音外加入 2、6。'),
      card('第 3 层 · 完整 C 大调',8,5,cMajor,'最后才加入 4 与 7。')
    ],
    'l3-01': [card('低把位的两枚落点',1,3,[mark(2,1,1,'C4','♭7',TARGET),mark(1,1,1,'F4','♭3',TARGET)],'两个音都用 1 指，弹完一个就放松再换弦；不需要横按。')],
    'l3-02': [
      card('Dm7 琶音',4,5,[mark(3,7,3,'D4','1',ROOT),mark(2,6,2,'F4','♭3',TARGET),mark(1,5,1,'A4','5'),mark(1,8,4,'C5','♭7',TARGET)]),
      card('G7 琶音',4,5,[mark(3,4,1,'B3','3',TARGET),mark(3,7,4,'D4','5'),mark(2,6,2,'F4','♭7',TARGET),mark(2,8,4,'G4','1',ROOT)]),
      card('Cmaj7 琶音',5,4,[mark(2,5,1,'E4','3',TARGET),mark(2,8,4,'G4','5'),mark(1,7,3,'B4','7',TARGET),mark(1,8,4,'C5','1',ROOT)])
    ],
    'l3-03': [
      card('上声部 · F4 → E4',1,2,[mark(1,1,1,'F4','G7 ♭7',TARGET),mark(1,0,0,'E4','Cmaj7 3',ROOT)],'F4 用 1 指；下一小节松开变成空弦 E4。'),
      card('下声部 · C4 → B3',1,2,[mark(2,1,1,'C4','Dm7 ♭7',TARGET),mark(2,0,0,'B3','G7 3',ROOT)],'C4 用 1 指；换和弦时松开成空弦 B3。')
    ],
    'l3-04': [card('三音动机 · 5品附近',5,4,[mark(2,5,1,'E4','3',TARGET),mark(2,8,4,'G4','5'),mark(1,7,3,'B4','7',COLOR)],'先固定这个按法，再只改变正拍/弱拍与休止。')],
    'l3-05': [card('D Dorian · 5品附近',5,4,dDorian,'B4 是本课特征音；F4、C5 是 Dm7 落点。')],
    'l3-06': [card('G Mixolydian / C Ionian 共用把位',5,4,cCentral,'同一按法上，G7 先看 B3/F4；Cmaj7 先看 E4/B4。')],
    'l3-07': [card('8 小节 solo 的共同把位',5,4,cCentral,'先圈出 F4、B4、E4，再用相邻音连接。')],
    'l3-08': [card('半音趋近 · 2弦一条线',3,4,[mark(2,3,1,'D4','下方音'),mark(2,4,2,'D#4','趋近',COLOR),mark(2,5,3,'E4','目标',TARGET),mark(2,6,4,'F4','上方音')],'用 1–2–3–4 指依次排开，D#4 必须走到 E4。')],
    'l3-09': [card('G 属 bebop · 4–8品',4,5,gBebop,'F#4 是经过音；从 G4 下行时，G/F/D/B 落正拍。')],
    'l3-10': [
      card('Bm7♭5',4,5,[mark(3,4,1,'B3','1',ROOT),mark(3,7,4,'D4','♭3',TARGET),mark(2,6,2,'F4','♭5'),mark(1,5,1,'A4','♭7')]),
      card('E7',4,4,[mark(4,6,2,'G#3','3',TARGET),mark(3,4,1,'B3','5'),mark(3,7,4,'D4','♭7',TARGET),mark(2,5,1,'E4','1',ROOT)]),
      card('Am7',5,4,[mark(4,7,3,'A3','1',ROOT),mark(3,5,1,'C4','♭3',TARGET),mark(2,5,1,'E4','5'),mark(2,8,4,'G4','♭7')])
    ],
    'l3-11': [card('A 和声小调 · 4–7品',4,4,aHarmonic,'G#4→A4、F4→E4 是本课两条解决线。')],
    'l3-12': [card('A 爵士旋律小调 · 4–7品',4,4,aMelodic,'F#4 是大六度，G#4 是大七度；上下行保持同一材料。')],
    'l3-13': [card('F 小调 blues · 4–8品',4,5,[mark(5,8,4,'F3','1',ROOT),mark(4,6,2,'A♭3','♭3',COLOR),mark(4,8,4,'B♭3','4'),mark(3,4,1,'B3','♭5',COLOR),mark(3,5,2,'C4','5'),mark(2,4,1,'E♭4','♭7'),mark(2,6,3,'F4','1',ROOT)],'A♭3 是蓝调小三度；和弦要求时再走向 A3。')],
    'l3-14': [card('模唱后的 ii–V–I 落点',4,5,[mark(2,6,2,'F4','Dm7 3',TARGET),mark(3,4,1,'B3','G7 3',TARGET),mark(2,5,1,'E4','Cmaj7 3',TARGET)],'先借真实录音的节奏，再把这三枚落点放到换和弦处。')],
    'l3-15': [card('结课作品的落点地图',4,5,[mark(2,6,2,'F4','Dm7 3',TARGET),mark(3,4,1,'B3','G7 3',TARGET),mark(2,5,1,'E4','Cmaj7 3',TARGET),mark(1,7,3,'B4','Cmaj7 7',COLOR)],'本课没有固定范奏；图只固定落点，不替你写中间的旋律。')],
    'l3-16': [card('G Lydian Dominant · 4–8品',4,5,gLydianDominant,'C#4 是 ♯11；先短暂经过，再回 D4/B3/F4。')],
    'l3-17': [card('G altered · 4–8品',4,5,gAltered,'A♭、B♭、D♭、E♭ 是变化色彩；必须先决定下一小节目标。')],
    'l3-18': [card('G 半全减 · 4–8品',4,5,gHalfWhole,'与 altered 比较：这里保留自然五音 D4 与自然十三音 E4。')]
  };

  function svgElement(name, attributes) {
    var element = document.createElementNS('http://www.w3.org/2000/svg', name);
    Object.keys(attributes || {}).forEach(function (key) { element.setAttribute(key, attributes[key]); });
    return element;
  }
  function addText(svg, x, y, value, className, anchor) {
    var node = svgElement('text', { x:x, y:y, class:className || '', 'text-anchor':anchor || 'middle' });
    node.textContent = value;
    svg.appendChild(node);
    return node;
  }
  function renderCard(spec) {
    var figure = document.createElement('figure');
    figure.className = 'finger-card';
    var title = document.createElement('figcaption');
    title.textContent = spec.name;
    figure.appendChild(title);

    var width = 210, left = 35, right = 185, nutY = 48, gap = 31;
    var height = nutY + spec.fretRows * gap + 32;
    var svg = svgElement('svg', { viewBox:'0 0 '+width+' '+height, role:'img', 'aria-label':spec.name });
    var desc = svgElement('desc');
    desc.textContent = spec.marks.map(function(x){ return x.string+'弦'+x.fret+'品 '+x.note+' '+(x.finger ? x.finger+'指' : '空弦'); }).join('；');
    svg.appendChild(desc);
    function xFor(string) { return left + (6 - string) * (right - left) / 5; }
    ['6 E','5 A','4 D','3 G','2 B','1 e'].forEach(function(label,i){ addText(svg,left+i*(right-left)/5,18,label,'finger-string-label'); });

    for (var string=1; string<=6; string++) {
      svg.appendChild(svgElement('line',{x1:xFor(string),y1:nutY,x2:xFor(string),y2:nutY+spec.fretRows*gap,class:'finger-string'}));
    }
    for (var fret=0; fret<=spec.fretRows; fret++) {
      svg.appendChild(svgElement('line',{x1:left,y1:nutY+fret*gap,x2:right,y2:nutY+fret*gap,class:(fret===0&&spec.baseFret===1)?'finger-nut':'finger-fret'}));
    }
    if (spec.baseFret > 1) addText(svg,left-8,nutY+gap/2+4,spec.baseFret+'fr','finger-fret-label','end');

    spec.barres.forEach(function(barre){
      var y = nutY + (barre.fret - spec.baseFret + .5) * gap;
      svg.appendChild(svgElement('line',{x1:xFor(barre.from),y1:y,x2:xFor(barre.to),y2:y,class:'finger-barre'}));
    });
    spec.marks.forEach(function(item){
      var x=xFor(item.string);
      if (item.fret === 0) {
        addText(svg,x,nutY-9,'○','finger-open');
        return;
      }
      var row=item.fret-spec.baseFret;
      if(row<0||row>=spec.fretRows)return;
      var y=nutY+(row+.5)*gap;
      var circle=svgElement('circle',{cx:x,cy:y,r:11,class:'finger-dot '+item.role});
      svg.appendChild(circle);
      addText(svg,x,y+4,String(item.finger),'finger-number');
    });
    figure.appendChild(svg);

    var route=document.createElement('p');
    route.className='finger-route';
    route.textContent=spec.marks.map(function(item){
      return item.string+'弦'+(item.fret===0?'空弦':item.fret+'品')+' '+item.note+'（'+(item.finger?item.finger+'指':'空弦')+'）';
    }).join(' · ');
    figure.appendChild(route);
    if(spec.note){
      var note=document.createElement('p'); note.className='finger-note'; note.textContent=spec.note; figure.appendChild(note);
    }
    return figure;
  }
  function render(container, specs) {
    container.classList.add('fingering-section');
    var heading=document.createElement('h3'); heading.textContent='推荐按法图'; container.appendChild(heading);
    var intro=document.createElement('p'); intro.className='finger-intro';
    intro.textContent='琴头在上，左侧为 6 弦、右侧为 1 弦；圈内数字是左手手指。它是一种省力建议，不是唯一正确指法。';
    container.appendChild(intro);
    var grid=document.createElement('div'); grid.className='finger-card-grid';
    specs.forEach(function(spec){grid.appendChild(renderCard(spec));});
    container.appendChild(grid);
    var legend=document.createElement('p'); legend.className='finger-legend';
    legend.innerHTML='<span class="root-swatch"></span>根音　<span class="target-swatch"></span>和弦落点　<span class="color-swatch"></span>特征/经过音　1 食指 · 2 中指 · 3 无名指 · 4 小指';
    container.appendChild(legend);
  }
  document.querySelectorAll('[data-fingering-set]').forEach(function(container){
    var specs=PRESETS[container.getAttribute('data-fingering-set')];
    if(specs) render(container,specs);
  });
  window.FretboardVisual={render:render,presets:PRESETS};
})();
