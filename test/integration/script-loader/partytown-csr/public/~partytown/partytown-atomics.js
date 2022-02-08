/* Partytown 0.3.3 - MIT builder.io */
;((e) => {
  const t = () => {},
    n = (e) => e.length,
    r = (e) => {
      try {
        return e.constructor.name
      } catch (e) {}
      return ''
    },
    s = (e, t) => e.startsWith(t),
    o = (e) =>
      !(
        s(e, 'webkit') ||
        s(e, 'toJSON') ||
        s(e, 'constructor') ||
        s(e, 'toString') ||
        s(e, '_')
      ),
    i = () => Math.round(999999999 * Math.random() + 4),
    a = Symbol(),
    l = Symbol(),
    c = new Map(),
    u = new Map(),
    h = {},
    d = new WeakMap(),
    p = (e, t, n) =>
      e
        ? e === e.window
          ? 0
          : '#document' === (n = e.nodeName)
          ? 1
          : 'HTML' === n
          ? 2
          : 'HEAD' === n
          ? 3
          : 'BODY' === n
          ? 4
          : ('number' != typeof (t = e[a]) && m(e, (t = i())), t)
        : -1,
    g = (e, t, n, r, s) => {
      if ((n = h[e]) && (r = n.M))
        return (
          (s = r.document),
          0 === t
            ? r
            : 1 === t
            ? s
            : 2 === t
            ? s.documentElement
            : 3 === t
            ? s.head
            : 4 === t
            ? s.body
            : c.get(t)
        )
    },
    m = (e, t, n) => {
      e &&
        (c.set(t, e),
        (e[a] = t),
        (e[l] = n = Date.now()),
        n > f + 5e3 &&
          (c.forEach((e, t) => {
            e[l] < f && e.nodeType && !e.isConnected && c.delete(t)
          }),
          (f = n)))
    }
  let f = 0
  const y = e.parent,
    w = document,
    $ = y.partytown || {},
    v = ($.lib || '/~partytown/') + '',
    b = (e, t, n, o, i) =>
      void 0 !== t && (o = typeof t)
        ? 'string' === o || 'number' === o || 'boolean' === o || null == t
          ? [0, t]
          : 'function' === o
          ? [6]
          : (n = n || new Set()) && Array.isArray(t)
          ? n.has(t)
            ? [1, []]
            : n.add(t) && [1, t.map((t) => b(e, t, n))]
          : 'object' === o
          ? '' === (i = r(t))
            ? [2, {}]
            : 'Window' === i
            ? [3, { N: e, r: 0 }]
            : 'HTMLCollection' === i || 'NodeList' === i
            ? [7, Array.from(t).map((t) => b(e, t, n)[1])]
            : i.endsWith('Event')
            ? [5, E(e, t, n)]
            : 'CSSRuleList' === i
            ? [12, Array.from(t).map(S)]
            : s(i, 'CSS') && i.endsWith('Rule')
            ? [11, S(t)]
            : 'CSSStyleDeclaration' === i
            ? [13, E(e, t, n)]
            : 'Attr' === i
            ? [10, [t.name, t.value]]
            : t.nodeType
            ? [3, { N: e, r: p(t), z: t.nodeName }]
            : [2, E(e, t, n, !0, !0)]
          : void 0
        : t,
    E = (e, t, n, r, s, i, a, l) => {
      if (((i = {}), !n.has(t)))
        for (a in (n.add(t), t))
          o(a) &&
            ((l = t[a]),
            (r || 'function' != typeof l) &&
              (s || '' !== l) &&
              (i[a] = b(e, l, n)))
      return i
    },
    S = (e) => {
      let t,
        n = {}
      for (t in e) L.includes(t) && (n[t] = e[t])
      return n
    },
    T = (t, n, r, s) =>
      n
        ? ((r = n[0]),
          (s = n[1]),
          0 === r
            ? s
            : 4 === r
            ? N(t, s)
            : 1 === r
            ? s.map((e) => T(t, e))
            : 3 === r
            ? g(s.N, s.r)
            : 5 === r
            ? M(I(t, s))
            : 2 === r
            ? I(t, s)
            : 8 === r
            ? s
            : 9 === r
            ? new e[n[2]](s)
            : void 0)
        : void 0,
    N = (e, { N: t, r: n, E: r }, s) => (
      (s = u.get(r)) ||
        ((s = function (...s) {
          e.postMessage([7, { N: t, r: n, E: r, K: b(t, this), b: b(t, s) }])
        }),
        u.set(r, s)),
      s
    ),
    M = (e) => new ('detail' in e ? CustomEvent : Event)(e.type, e),
    I = (e, t, n, r) => {
      for (r in ((n = {}), t)) n[r] = T(e, t[r])
      return n
    },
    L =
      'cssText,selectorText,href,media,namespaceURI,prefix,name,conditionText'.split(
        ','
      ),
    x = async (e, t) => {
      let r,
        s,
        o,
        i,
        a,
        l,
        c = { y: t.y },
        u = n(t.J),
        d = 0
      for (; d < u; d++)
        try {
          ;(l = d === u - 1),
            (r = t.J[d]),
            (s = r.N),
            (o = r.a),
            h[s] ||
              (await new Promise((e) => {
                let t = 0,
                  n = () => {
                    h[s] || t++ > 999 ? e() : setTimeout(n, 9)
                  }
                n()
              })),
            1 === o[0] && o[1] in h[s].M
              ? m(new h[s].M[o[1]](...T(e, o[2])), r.r)
              : ((i = g(s, r.r)),
                i
                  ? ((a = C(e, i, o, l, r.n)),
                    r.c && m(a, r.c),
                    'object' == typeof (p = a) &&
                      p &&
                      p.then &&
                      ((a = await a), (c.u = !0)),
                    (c.F = b(s, a)))
                  : (c.l = r.r + ' not found'))
        } catch (e) {
          l ? (c.l = String(e.stack || e)) : console.error(e)
        }
      var p
      return c
    },
    C = (e, t, r, s, o) => {
      let i,
        a,
        l,
        c,
        u,
        h = 0,
        d = n(r)
      for (; h < d; h++) {
        ;(a = r[h]), (i = r[h + 1]), (l = r[h - 1])
        try {
          if (!Array.isArray(i))
            if ('string' == typeof a || 'number' == typeof a) {
              if (h + 1 === d && o)
                return (u = {}), o.map((e) => (u[e] = t[e])), u
              t = t[a]
            } else {
              if (0 === i) return void (t[l] = T(e, a))
              if (
                'function' == typeof t[l] &&
                ((c = T(e, a)),
                'insertRule' === l &&
                  c[1] > n(t.cssRules) &&
                  (c[1] = n(t.cssRules)),
                (t = t[l].apply(t, c)),
                'play' === l)
              )
                return Promise.resolve()
            }
        } catch (e) {
          if (s) throw e
          console.debug(e)
        }
      }
      return t
    },
    O = (e, t, n) => {
      if (!d.has(n)) {
        d.set(n, t)
        const r = n.document,
          s = n.history,
          o = d.get(n.parent),
          i = () => e.postMessage([3, { N: t, C: o, L: r.baseURI }]),
          a = s.pushState.bind(s),
          l = s.replaceState.bind(s),
          c = () => setTimeout(() => e.postMessage([11, t, r.baseURI]))
        ;(s.pushState = (e, t, n) => {
          a(e, t, n), c()
        }),
          (s.replaceState = (e, t, n) => {
            l(e, t, n), c()
          }),
          n.addEventListener('popstate', c),
          n.addEventListener('hashchange', c),
          (h[t] = { N: t, M: n }),
          'complete' === r.readyState ? i() : n.addEventListener('load', i)
      }
    },
    A = (e, t) => {
      let r,
        s,
        o,
        i = t.N,
        a = t.M,
        l = a.document
      l && l.body
        ? ((r = l.querySelector(
            'script[type="text/partytown"]:not([data-ptid]):not([data-pterror]):not([async]):not([defer])'
          )),
          r ||
            (r = l.querySelector(
              'script[type="text/partytown"]:not([data-ptid]):not([data-pterror])'
            )),
          r
            ? ((r.dataset.ptid = s = p(r, i)),
              (o = { N: i, r: s }),
              r.src
                ? ((o.L = r.src), (o.A = r.dataset.ptsrc || r.src))
                : (o.g = r.innerHTML),
              e.postMessage([5, o]))
            : (t.s ||
                ((t.s = 1),
                ((e, t, r) => {
                  let s,
                    o,
                    i = r._ptf,
                    a = (r.partytown || {}).forward || [],
                    l = (n, r) =>
                      e.postMessage([8, { N: t, m: n, b: b(t, Array.from(r)) }])
                  if (
                    ((r._ptf = void 0),
                    a.map((e) => {
                      ;(o = r),
                        e.split('.').map((e, t, r) => {
                          o = o[r[t]] =
                            t + 1 < n(r)
                              ? o[r[t]] || ('push' === r[t + 1] ? [] : {})
                              : (...e) => l(r, e)
                        })
                    }),
                    i)
                  )
                    for (s = 0; s < n(i); s += 2) l(i[s], i[s + 1])
                })(e, i, a),
                l.dispatchEvent(new CustomEvent('pt0'))),
              e.postMessage([6, i])))
        : requestAnimationFrame(() => A(e, t))
    },
    R = (e, t, n) => {
      let r = [],
        s = [e, 'Object', r]
      for (n in t) H(r, t, n)
      return s
    },
    P = (e, t, n, s, o) => {
      if ('Object' !== t && !e.some((e) => e[0] === t)) {
        const i = Object.getPrototypeOf(n),
          a = r(i),
          l = []
        P(e, a, i, s, o),
          Object.keys(Object.getOwnPropertyDescriptors(n)).map((e) =>
            H(l, s, e)
          ),
          e.push([t, a, l, o, s.nodeName])
      }
    },
    H = (e, t, n, s, i, a) => {
      try {
        o(n) &&
          isNaN(n[0]) &&
          'all' !== n &&
          ('function' == (i = typeof (s = t[n]))
            ? (String(s).includes('[native') || Object.getPrototypeOf(t)[n]) &&
              e.push([n, 5])
            : 'object' === i && null != s
            ? 'Object' !== (a = r(s)) && self[a] && e.push([n, s.nodeType || a])
            : 'symbol' !== i &&
              (n.toUpperCase() === n ? e.push([n, 6, s]) : e.push([n, 6])))
      } catch (e) {
        console.warn(e)
      }
    },
    D = {
      Anchor: 'A',
      DList: 'DL',
      Image: 'IMG',
      OList: 'OL',
      Paragraph: 'P',
      TableCaption: 'CAPTION',
      TableCell: 'TD',
      TableCol: 'COLGROUP',
      TableRow: 'TR',
      TableSection: 'TBODY',
      UList: 'UL',
    },
    j = (e) => {
      let t,
        r = [],
        s = 0,
        o = n(y[e])
      for (; s < o; s++) (t = y[e].key(s)), r.push([t, y[e].getItem(t)])
      return r
    },
    k = (e, n) => (void 0 !== e[n] ? new e[n](t) : 0)
  let W
  ;(async (e) => {
    const t = new SharedArrayBuffer(1073741824),
      n = new Int32Array(t)
    return (s, o) => {
      const a = o[0],
        l = o[1]
      if (0 === a) {
        const e = (() => {
          const e = w.implementation.createHTMLDocument(),
            t = e.createTextNode(''),
            n = e.createComment(''),
            s = e.createDocumentFragment(),
            o = e.createElementNS('http://www.w3.org/2000/svg', 'svg'),
            i = k(y, 'IntersectionObserver'),
            a = k(y, 'MutationObserver'),
            l = k(y, 'ResizeObserver'),
            c = y.performance,
            u = y.screen,
            h = Object.getOwnPropertyNames(y)
              .filter((e) => /^HTML.+Element$/.test(e))
              .map((t) => {
                return [
                  e.createElement(
                    ((n = t),
                    (n = n.slice(4).replace('Element', '')),
                    D[n] || n)
                  ),
                ]
                var n
              }),
            d = h[0][0],
            p = [
              [y.history],
              [c],
              [c.navigation],
              [c.timing],
              [u],
              [u.orientation],
              [i, 12],
              [a, 12],
              [l, 12],
              [t],
              [n],
              [s],
              [d],
              [d.attributes],
              [d.classList],
              [d.dataset],
              [d.style],
              [o],
              [e],
              [e.doctype],
              ...h,
            ]
              .filter((e) => e[0])
              .map((e) => {
                const t = e[0],
                  n = e[1],
                  s = r(t)
                return [s, y[s].prototype, t, n]
              }),
            g = [R('Window', y), R('Node', t)],
            m = {
              f: JSON.stringify(
                $,
                (e, t) => (
                  'function' == typeof t &&
                    (t = String(t)).startsWith(e + '(') &&
                    (t = 'function ' + t),
                  t
                )
              ),
              v: new URL(v, y.location) + '',
              q: g,
              w: j('localStorage'),
              H: j('sessionStorage'),
            }
          return p.map(([e, t, n, r]) => P(g, e, t, n, r)), m
        })()
        ;(e.I = t), s.postMessage([1, e])
      } else
        9 === a
          ? e(l, (e) => {
              const t = JSON.stringify(e),
                r = t.length
              for (let e = 0; e < r; e++) n[e + 1] = t.charCodeAt(e)
              ;(n[0] = r), Atomics.notify(n, 0)
            })
          : ((e, t, n) => {
              2 === t[0]
                ? O(e, i(), y)
                : (n = h[t[1]]) &&
                  (5 === t[0]
                    ? requestAnimationFrame(() => A(e, n))
                    : 4 === t[0] &&
                      ((e, t, n, r, s) => {
                        ;(s = t.M.document.querySelector(
                          `[data-ptid="${n}"]`
                        )) && (r ? (s.dataset.pterror = r) : (s.type += '-x')),
                          A(e, t)
                      })(e, n, t[2], t[3]))
            })(s, o)
    }
  })((e, t) => x(W, e).then(t)).then((e) => {
    e &&
      ((W = new Worker(
        URL.createObjectURL(
          new Blob(
            [
              '/* Partytown 0.3.3 - MIT builder.io */\n(e=>{const t=Symbol(),n=Symbol(),r=Symbol(),s=Symbol(),i=Symbol(),o=Symbol(),a=Symbol(),l=Symbol(),c=new Map,$={},u=new WeakMap,h=new Map,d={},p=[],g={},m=new Map,f=new Map,w={},y=new Map,I=new Map,v=e=>e.split(","),b=e=>{if(e=g.v+e,new URL(e).origin!=location.origin)throw"Invalid "+e;return e},S=v("clientWidth,clientHeight,clientTop,clientLeft,innerWidth,innerHeight,offsetWidth,offsetHeight,offsetTop,offsetLeft,outerWidth,outerHeight,pageXOffset,pageYOffset,scrollWidth,scrollHeight,scrollTop,scrollLeft"),E=v("childNodes,firstChild,isConnected,lastChild,nextSibling,parentElement,parentNode,previousSibling"),T=v("childElementCount,children,firstElementChild,lastElementChild,nextElementSibling,previousElementSibling"),M=v("insertBefore,remove,removeChild,replaceChild"),N=v("className,width,height,hidden,innerHTML,innerText,textContent"),L=v("setAttribute,setProperty"),x=v("getClientRects,getBoundingClientRect"),A=["getComputedStyle"],C=v("addEventListener,dispatchEvent,removeEventListener"),W=C.concat(L,v("add,observe,remove,unobserve")),R=/^[A-Z]([A-Z0-9-]*[A-Z0-9])?$/,P=()=>{},H=e=>e.length,O=e=>{try{return e.constructor.name}catch(e){}return""},D=[],k=()=>Math.round(999999999*Math.random()+4),B="text/partytown",j=(e,t,n)=>Object.defineProperty(e,t,{...n,configurable:!0}),U=(e,t)=>j(e,"name",{value:t}),F=(e,t,n)=>j(e.prototype,t,n),_=(e,t)=>Object.defineProperties(e.prototype,t),z=(e,t,n)=>F(e,t,{value:n,writable:!0}),V=(e,t)=>t in e[o],q=(e,t)=>e[o][t],X=(e,t,n)=>e[o][t]=n,Z=[];let J=0;const Y=(e,r,s,o,a,l)=>{if(Z.push({N:e[t],r:e[n],a:[...e[i],...r],c:o,n:a}),3===s)g.D([10,{y:k(),J:[...Z]}],l?[l instanceof ArrayBuffer?l:l.buffer]:void 0),Z.length=0;else if(1===s)return G(!0);J=setTimeout(G,20)},G=e=>{if(clearTimeout(J),H(Z)){const t=Z[H(Z)-1],n={y:k(),J:[...Z]};if(Z.length=0,e){const e=((e,t)=>{const n=e.I,r=new Int32Array(n);Atomics.store(r,0,0),e.D([9,t]),Atomics.wait(r,0,0);let s=Atomics.load(r,0),i="",o=0;for(;o<s;o++)i+=String.fromCharCode(r[o+1]);return JSON.parse(i)})(g,n),r=e.u,s=Oe(t.N,t.r,t.a,e.F);if(e.l){if(r)return Promise.reject(e.l);throw new Error(e.l)}return r?Promise.resolve(s):s}g.D([10,n])}},K=(e,t,n,r)=>g.f.get&&(r=g.f.get(ne(e,t)))!==a?r:r=Y(e,t,1,void 0,n),Q=(e,t,n,r)=>{if(g.f.set){if((r=g.f.set({value:n,prevent:l,...ne(e,t)}))===l)return;r!==a&&(n=r)}N.some((e=>t.includes(e)))&&(y.clear(),t[t.length-1]),t=[...t,He(e,n),0],Y(e,t,2)},ee=(e,t,n,r,s,i,o,l)=>g.f.apply&&(o=g.f.apply({args:n,...ne(e,t)}))!==a?o:(l=t[H(t)-1],t=[...t,He(e,n)],r=r||(W.includes(l)?2:1),"setAttribute"===l&&V(e,n[0])?X(e,n[0],n[1]):M.includes(l)?(y.clear(),I.clear()):L.includes(l)&&(r=2,y.clear()),o=Y(e,t,r,s,void 0,i)),te=(e,t,n)=>{Y(e,[1,t,He(e,n)],1)},ne=(e,t)=>({name:t.join("."),continue:a,nodeName:e[r],constructor:O(e)}),re=(t,n,r)=>{let s,i,o=()=>e.origin===t.origin,a=e=>((e=r.get(t.origin))||r.set(t.origin,e=[]),e),l=e=>a().findIndex((t=>t[se]===e)),c={getItem:e=>(s=l(e),s>-1?a()[s][ie]:null),setItem(e,r){s=l(e),s>-1?a()[s][ie]=r:a().push([e,r]),o()&&ee(t,[n,"setItem"],[e,r],2)},removeItem(e){s=l(e),s>-1&&a().splice(s,1),o()&&ee(t,[n,"removeItem"],[e],2)},key:e=>(i=a()[e],i?i[se]:null),clear(){a().length=0,o()&&ee(t,[n,"clear"],D,2)},get length(){return a().length}};t[n]=c},se=0,ie=1;class oe{constructor(e,a,l,c,$){this[t]=e,this[n]=a,this[i]=l||[],this[r]=c,this[o]={},$&&(this[s]=$)}}class ae extends oe{}C.map((e=>ae.prototype[e]=function(...t){return ee(this,[e],t,2)}));class le extends oe{constructor(e,t,n,r){return super(e,t,n,r),new Proxy(this,{get:(e,t)=>K(e,[t]),set:(e,t,n)=>(Q(e,[t],n),!0)})}}const ce=()=>(e.ptm||(e.ptm=[K,Q,ee,te,_,k,oe,ae,t,n,i],g.p(b("partytown-media.js"))),e.ptm),$e=v("AUDIO,CANVAS,VIDEO"),ue=v("Audio,MediaSource"),he=(e,t,n,r,s)=>((s=c.get(t))||(s=de(e,t,n,r),c.set(t,s)),s),de=(t,n,r,s)=>($e.includes(r)&&ce(),new(d[r]?d[r]:r.includes("-")?d.UNKNOWN:e.HTMLElement)(t,n,[],r,s)),pe=(e,t,n,r,s)=>{try{e.h=t,ge(e,n)}catch(e){console.error(n,e),s=String(e.stack||e)}return e.h=-1,s},ge=(e,t,n)=>{e.G=1,new Function(`with(this){${t.replace(/\\bthis\\b/g,"(thi$(this)?window:this)").replace(/\\/\\/# so/g,"//Xso")}\\n;function thi$(t){return t===this}${(g.f.globalFns||[]).filter((e=>/[a-zA-Z_$][0-9a-zA-Z_$]*/.test(e))).map((e=>`(typeof ${e}==\'function\'&&(window.${e}=${e}))`)).join(";")}}`+(n?"\\n//# sourceURL="+n:"")).call(e.M),e.G=0},me=(e,t,n)=>{(n=q(e,t))&&setTimeout((()=>n.map((e=>e({type:t})))))},fe=(e,t,n,r,s,i)=>{for(r=e.x;!r.host&&(r=(e=w[e.C]).x,e.N!==e.C););return s=new URL(t||"",r),!n&&g.f.resolveUrl&&(i=g.f.resolveUrl(s,r))?i:s},we=(e,t,n)=>fe(e,t,n)+"",ye=()=>`<script src="${b("partytown.js")}"><\\/script>`,Ie=e=>class{constructor(){this.s="",this.l=[],this.e=[]}get src(){return this.s}set src(t){fetch(we(e,t,!0),{mode:"no-cors",keepalive:!0}).then((e=>{e.ok||0===e.status?this.l.map((e=>e({type:"load"}))):this.e.map((e=>e({type:"error"})))}),(()=>this.e.forEach((e=>e({type:"error"})))))}addEventListener(e,t){"load"===e&&this.l.push(t),"error"===e&&this.e.push(t)}get onload(){return this.l[0]}set onload(e){this.l=[e]}get onerror(){return this.e[0]}set onerror(e){this.e=[e]}};class ve extends URL{assign(){}reload(){}replace(){}}class Window extends oe{constructor(t,n,r,s){super(t,0);let i,o,a,l=this;for(i in e)if(!(i in l)&&"onmessage"!==i&&(o=e[i],null!=o)){const t="function"==typeof o&&!o.toString().startsWith("class");l[i]=t?o.bind(e):o}Object.getOwnPropertyNames(e).map((t=>{t in l||(l[t]=e[t])})),h.forEach(((e,n)=>{l[n]=U(class{constructor(...r){const s=new e(t,k());return te(s,n,r),s}},n)})),ue.map((e=>j(l,e,{get(){delete l[e];const t=ce()[e];return l[e]=t(Ee(l),l,e)}}))),"trustedTypes"in e&&(l.trustedTypes=e.trustedTypes),w[t]={N:t,C:n,M:new Proxy(l,{has:()=>!0}),j:de(t,1,"#document"),k:de(t,2,"HTML"),o:de(t,3,"HEAD"),d:de(t,4,"BODY"),x:new ve(r)},l.requestAnimationFrame=e=>setTimeout((()=>e(performance.now())),9),l.cancelAnimationFrame=e=>clearTimeout(e),l.requestIdleCallback=(e,t)=>(t=Date.now(),setTimeout((()=>e({didTimeout:!1,timeRemaining:()=>Math.max(0,50-(Date.now()-t))})),1)),l.cancelIdleCallback=e=>clearTimeout(e),re(l,"localStorage",m),re(l,"sessionStorage",f),s&&(a={},l.history={pushState(e){a=e},replaceState(e){a=e},get state(){return a},length:0}),l.Worker=void 0}addEventListener(...e){"load"===e[0]?Ee(this).G&&setTimeout((()=>e[1]({type:"load"}))):ee(this,["addEventListener"],e,2)}get body(){return Ee(this).d}get document(){return Ee(this).j}get documentElement(){return Ee(this).k}fetch(e,t){return e="string"==typeof e||e instanceof URL?String(e):e.url,fetch(we(Ee(this),e),t)}get frameElement(){const e=Ee(this),t=e.C,n=e.N;return n===t?null:he(t,n,"IFRAME")}get globalThis(){return this}get head(){return Ee(this).o}get location(){return Ee(this).x}set location(e){Ee(this).x.href=e+""}get Image(){return Ie(Ee(this))}get name(){return name+this[t]}get navigator(){return(t=>{const n=e.navigator;return n.sendBeacon=(e,n)=>{try{return fetch(we(t,e,!0),{method:"POST",body:n,mode:"no-cors",keepalive:!0}),!0}catch(e){return console.error(e),!1}},n})(Ee(this))}get origin(){return Ee(this).x.origin}get parent(){return be(w[Ee(this).C].M,this[t])}postMessage(...e){ee(this,["postMessage"],e,3)}get self(){return this}get top(){for(let e in w)if(w[e].N===w[e].C)return be(w[e].M,this[t])}get window(){return this}get XMLHttpRequest(){const t=Ee(this);return class extends e.XMLHttpRequest{open(...e){e[1]=we(t,e[1]),super.open(...e)}set withCredentials(e){}}}}const be=(e,t)=>new Proxy(e,{get:(e,n)=>"postMessage"===n?(...n)=>{H(p)>20&&p.splice(0,5),p.push({i:JSON.stringify(n[0]),N:t}),e.postMessage(...n)}:e[n]}),Se=({N:e,C:t,L:n},r)=>(w[e]||new Window(e,t,n,r),g.D([5,e]),w[e]),Ee=e=>w[e[t]],Te={addEventListener:{value(...e){const t=e[0],n=q(this,t)||[];n.push(e[1]),X(this,t,n)}},async:{get:P,set:P},defer:{get:P,set:P},onload:{get(){let e=q(this,"load");return e&&e[0]||null},set(e){X(this,"load",e?[e]:null)}},onerror:{get(){let e=q(this,"error");return e&&e[0]||null},set(e){X(this,"error",e?[e]:null)}},getAttribute:{value(e){return"src"===e?this.src:ee(this,["getAttribute"],[e])}},setAttribute:{value(e,t){Me.includes(e)?this[e]=t:ee(this,["setAttribute"],[e,t])}}},Me=v("src,type"),Ne={get(){return q(this,3)||""},set(e){X(this,3,e)}},Le={innerHTML:Ne,innerText:Ne,src:{get(){return q(this,4)||""},set(e){const t=Ee(this),n=we(t,e,!0);e=we(t,e),X(this,4,e),Q(this,["src"],e),n!==e&&Q(this,["dataset","ptsrc"],n)}},textContent:Ne,type:{get(){return K(this,["type"])},set(e){xe(e)||(X(this,5,e),Q(this,["type"],e))}},...Te},xe=e=>!e||"text/javascript"===e;class Node extends oe{appendChild(e){return this.insertBefore(e,null)}get href(){}set href(e){}insertBefore(e,s){const i=e[t]=this[t],o=e[n],a=e[r],l="SCRIPT"===a,c="IFRAME"===a;if(l){const t=q(e,3),n=q(e,5);if(t){if(xe(n)){const n=pe(Ee(e),o,t,0,""),r=n?"pterror":"ptid",s=n||o;Q(e,["type"],B+"-x"),Q(e,["dataset",r],s)}Q(e,["innerHTML"],t)}}return ee(this,["insertBefore"],[e,s],2),c&&((e,t)=>{let n,r,s=0,i=()=>{w[e]&&w[e].s&&!w[e].t?(n=q(t,1)?"error":"load",r=q(t,n),r&&r.map((e=>e({type:n})))):s++>2e3?(r=q(t,"error"),r&&r.map((e=>e({type:"error"})))):setTimeout(i,9)};i()})(o,e),l&&(G(!0),g.D([5,i])),e}get nodeName(){return this[r]}get nodeType(){return 3}get ownerDocument(){return Ee(this).j}}class Ae{constructor(e){this.name=e[0],this.value=e[1]}get nodeName(){return this.name}get nodeType(){return 2}}class Ce extends oe{constructor(e,t,n,r){return super(e,t,n),Object.assign(this,r),new Proxy(this,{get:(e,t)=>e[t],set:(e,t,n)=>(Q(e,[t],n),y.clear(),!0)})}getPropertyValue(e){return this[e]}setProperty(e,t){this[e]=t}}class NodeList{constructor(e){(this._=e).map(((e,t)=>this[t]=e))}entries(){return this._.entries()}forEach(e,t){this._.map(e,t)}item(e){return this[e]}keys(){return this._.keys()}get length(){return H(this._)}values(){return this._.values()}[Symbol.iterator](){return this._[Symbol.iterator]()}}const We=(e,r,s,i,o)=>{return void 0!==s&&(o=typeof s)?"string"===o||"boolean"===o||"number"===o||null==s?[0,s]:"function"===o?[4,{N:e,r:r,E:(a=s,(l=u.get(a))||(u.set(a,l=k()),$[l]=a),l)}]:(i=i||new Set)&&Array.isArray(s)?i.has(s)?[1,[]]:i.add(s)&&[1,s.map((t=>We(e,r,t,i)))]:"object"===o?"number"==typeof s[n]?[3,{N:s[t],r:s[n]}]:s instanceof Event?[5,Pe(e,r,s,!1,i)]:Re&&s instanceof TrustedHTML?[0,s.toString()]:s instanceof ArrayBuffer?[8,s]:ArrayBuffer.isView(s)?[9,s.buffer,O(s)]:[2,Pe(e,r,s,!0,i)]:void 0:s;var a,l},Re="undefined"!=typeof TrustedHTML,Pe=(e,t,n,r,s,i,o,a)=>{if(i={},!s.has(n))for(o in s.add(n),n)a=n[o],(r||"function"!=typeof a)&&(i[o]=We(e,t,a,s));return i},He=(e,r)=>e?We(e[t],e[n],r):[0,r],Oe=(e,t,n,r,s,i,o,a)=>{if(r){if(s=r[0],i=r[1],0===s||11===s||12===s)return i;if(4===s)return Be(n,i);if(6===s)return P;if(3===s)return De(i);if(7===s)return new NodeList(i.map(De));if(10===s)return new Ae(i);if(1===s)return i.map((r=>Oe(e,t,n,r)));for(a in o={},i)o[a]=Oe(e,t,[...n,a],i[a]);if(13===s)return new Ce(e,t,n,o);if(5===s){if("message"===o.type&&o.origin){let e,t=JSON.stringify(o.data),n=p.find((e=>e.i===t));n&&(e=w[n.N],e&&(o.source=e.M,o.origin=e.x.origin))}return new Proxy(new Event(o.type,o),{get:(e,t)=>t in o?o[t]:"function"==typeof e[String(t)]?P:e[String(t)]})}if(2===s)return o}},De=({N:e,r:t,z:n})=>ke(e,t)||he(e,t,n),ke=(e,t,n)=>(n=w[e])&&0===t?n.M:1===t?n.j:2===t?n.k:3===t?n.o:4===t?n.d:void 0,Be=(e,{N:t,r:n,z:r,E:s})=>($[s]||u.set($[s]=function(...s){const i=he(t,n,r);return ee(i,e,s)},s),$[s]),je={sheet:{get(){return new Ue(this)}}};class Ue{constructor(e){this.ownerNode=e}get cssRules(){const e=this.ownerNode;return new Proxy({},{get(t,n){const r=String(n);return"item"===r?t=>_e(e,t):"length"===r?Fe(e).length:isNaN(r)?t[n]:_e(e,r)}})}insertRule(e,t){const n=Fe(this.ownerNode);return(t=void 0===t?0:t)>=0&&t<=n.length&&(ee(this.ownerNode,["sheet","insertRule"],[e,t],2),n.splice(t,0,0)),this.ownerNode,y.clear(),t}deleteRule(e){ee(this.ownerNode,["sheet","deleteRule"],[e],2),Fe(this.ownerNode).splice(e,1),this.ownerNode,y.clear()}}const Fe=(e,t)=>((t=q(e,2))||(t=K(e,["sheet","cssRules"]),X(e,2,t)),t),_e=(e,t,n)=>(0===(n=Fe(e))[t]&&(n[t]=K(e,["sheet","cssRules",parseInt(t,10)])),n[t]),ze={body:{get(){return Ee(this).d}},createElement:{value(e){if(e=e.toUpperCase(),!R.test(e))throw e+" not valid";const n=this[t],r=k(),s=he(n,r,e);if(ee(this,["createElement"],[e],2,r),"IFRAME"===e)Se({N:r,C:n,L:"about:blank"},!0).M.fetch=fetch,Q(s,["srcdoc"],ye());else if("SCRIPT"===e){const e=q(s,5);xe(e)&&Q(s,["type"],B)}return s}},createElementNS:{value(e,n){n=n.toLowerCase();const r=this[t],s=k(),i=he(r,s,n,e);return ee(this,["createElementNS"],[e,n],2,s),i}},createTextNode:{value(e){const n=this[t],r=k(),s=he(n,r,"#text");return ee(this,["createTextNode"],[e],2,r),s}},createEvent:{value:e=>new Event(e)},currentScript:{get(){const e=this[t],n=Ee(this).h;return n>0?he(e,n,"SCRIPT"):null}},defaultView:{get(){return Ee(this).M}},documentElement:{get(){return Ee(this).k}},getElementsByTagName:{value(e){return"BODY"===(e=e.toUpperCase())?[Ee(this).d]:"HEAD"===e?[Ee(this).o]:ee(this,["getElementsByTagName"],[e])}},head:{get(){return Ee(this).o}},implementation:{value:{hasFeature:()=>!0}},location:{get(){return Ee(this).x},set(e){Ee(this).x.href=e+""}},nodeType:{value:9},parentNode:{value:null},parentElement:{value:null},readyState:{value:"complete"}},Ve={parentElement:{get(){return this.parentNode}},parentNode:{get(){return Ee(this).k}}},qe={parentElement:{value:null},parentNode:{get(){return Ee(this).j}}},Xe={localName:{get(){return this[r].toLowerCase()}},namespaceURI:{get(){return this[s]||"http://www.w3.org/1999/xhtml"}},nodeType:{value:1},tagName:{get(){return this[r]}}},Ze={};v("hash,host,hostname,href,origin,pathname,port,protocol,search").map((e=>{Ze[e]={get(){let t,n=Ee(this),r=q(this,4);return"string"!=typeof r&&(t=K(this,["href"]),X(this,4,t),r=new URL(t)[e]),fe(n,r)[e]},set(t){let n=Ee(this),r=q(this,4),s=fe(n,r);s[e]=new URL(t+"",s.href),X(this,4,s.href),Q(this,["href"],s.href)}}}));const Je={contentDocument:{get(){return Ye(this).j}},contentWindow:{get(){return Ye(this).M}},src:{get(){let e=Ye(this).x.href;return e.startsWith("about")&&(e=""),e},set(e){let t,n=new XMLHttpRequest,r=Ye(this);r.x.href=e=we(Ee(this),e),r.t=1,X(this,1,void 0),n.open("GET",e,!1),n.send(),t=n.status,t>199&&t<300?(Q(this,["srcdoc"],`<base href="${e}">`+n.responseText.replace(/<script>/g,\'<script type="text/partytown">\').replace(/<script /g,\'<script type="text/partytown" \').replace(/text\\/javascript/g,B)+ye()),G(!0),g.D([5,r.N])):(X(this,1,t),r.t=0)}},...Te},Ye=e=>{const r=e[n];return w[r]||Se({N:r,C:e[t],L:K(e,["src"])||"about:blank"},!0),w[r]},Ge=([s,o,a,l,c])=>{const $=Ke[s]?le:"EventTarget"===o?ae:"Object"===o?oe:e[o],u=e[s]=U(e[s]||class extends ${},s);12===l&&h.set(s,u),c&&(d[c]=u),a.map((([s,o,a])=>{s in u.prototype||s in $.prototype||("string"==typeof o?F(u,s,{get(){if(!V(this,s)){const a=this[t],l=this[n],c=[...this[i],s],$=this[r],u=e[o];X(this,s,new u(a,l,c,$))}return q(this,s)},set(e){X(this,s,e)}}):5===o?z(u,s,(function(...e){return ee(this,[s],e)})):o>0&&(void 0!==a?z(u,s,a):F(u,s,{get(){return K(this,[s])},set(e){return Q(this,[s],e)}})))}))},Ke={CSSStyleDeclaration:1,DOMStringMap:1,NamedNodeMap:1},Qe=(e,t)=>z(e,"nodeType",t),et=(e,t)=>t.map((t=>F(e,t,{get(){let e=tt(this,t),n=I.get(e);return n||(n=K(this,[t]),I.set(e,n)),n}}))),tt=(e,r,s)=>[e[t],e[n],r,...(s||D).map((e=>String(e&&e[t]?e[n]:e)))].join("."),nt=(e,t)=>v(t).map((t=>F(e,t,{get(){return V(this,t)||X(this,t,K(this,[t])),q(this,t)},set(e){q(this,t)!==e&&Q(this,[t],e),X(this,t,e)}}))),rt=e=>S.map((t=>F(e,t,{get(){const e=y.get(tt(this,t));if("number"==typeof e)return e;const n=K(this,[t],S);return n&&"object"==typeof n?(Object.entries(n).map((([e,t])=>y.set(tt(this,e),t))),n[t]):n}}))),st=(e,t)=>t.map((t=>{e.prototype[t]=function(...e){let n=tt(this,t,e),r=y.get(n);return r||(r=ee(this,[t],e),y.set(n,r)),r}}));class it extends oe{now(){return performance.now()}}const ot=[],at=t=>{const n=t.data,r=n[0],s=n[1];g.s?5===r?(async t=>{let n,r=t.N,s=t.r,i=he(r,s,"SCRIPT"),o=t.g,a=t.L,l=t.A,c="",$=w[r];if(a)try{a=fe($,a)+"",X(i,4,a),n=await e.fetch(a),n.ok?(o=await n.text(),$.h=s,ge($,o,l||a),me(i,"load")):(c=n.statusText,me(i,"error"))}catch(e){console.error(e),c=String(e.stack||e),me(i,"error")}else o&&(c=pe($,s,o,0,c));$.h=-1,g.D([4,r,s,c])})(s):7===r?(({N:e,r:t,E:n,K:r,b:s})=>{if($[n])try{$[n].apply(Oe(e,t,[],r),Oe(e,t,[],s))}catch(e){console.error(e)}})(s):8===r?(({N:e,m:t,b:n})=>{try{let r=w[e].M,s=0,i=H(t);for(;s<i;s++)s+1<i?r=r[t[s]]:r[t[s]].apply(r,Oe(null,0,[],n))}catch(e){console.error(e)}})(s):3===r?Se(s):6===r?(w[s].s=1,w[s].t=0):11===r&&(w[n[1]].x.href=n[2]):1===r?((t=>{const n=g.f=JSON.parse(t.f);g.p=importScripts.bind(e),g.v=t.v,g.D=postMessage.bind(e),g.I=t.I,m.set(origin,t.w),f.set(origin,t.H),delete e.postMessage,delete e.importScripts,e.Node=Node,e.Window=Window,e.CSSStyleSheet=Ue,e.Performance=it,t.q.map(Ge),(()=>{const t=e.Document,n=e.DocumentFragment,r=e.Element;var s,i;v("atob,btoa,crypto,indexedDB,setTimeout,setInterval,clearTimeout,clearInterval").map((e=>delete Window.prototype[e])),_(r,Xe),_(t,ze),_(e.HTMLAnchorElement,Ze),_(e.HTMLIFrameElement,Je),_(e.HTMLScriptElement,Le),_(e.HTMLStyleElement,je),_(e.HTMLHeadElement,Ve),_(e.HTMLBodyElement,Ve),_(e.HTMLHtmlElement,qe),s=Ue,i={type:"text/css"},Object.keys(i).map((e=>z(s,e,i[e]))),Qe(e.Comment,8),Qe(e.DocumentType,10),Qe(n,11),et(Node,E),et(r,T),et(n,T),rt(r),st(r,x),rt(Window),st(Window,A),nt(Window,"devicePixelRatio"),nt(t,"compatMode,referrer"),nt(r,"id")})(),["resolveUrl","get","set","apply"].map((e=>{n[e]&&(n[e]=new Function("return "+n[e])())})),g.s=1})(n[1]),g.D([2]),[...ot].map(at),ot.length=0):ot.push(t)};e.onmessage=at,postMessage([0])})(self);\n',
            ],
            { type: 'text/javascript' }
          )
        ),
        { name: 'Partytown 🎉' }
      )),
      (W.onmessage = (t) => {
        const n = t.data
        10 === n[0] ? x(W, n[1]) : e(W, n)
      }),
      y.addEventListener('pt1', (e) =>
        O(W, p(e.detail.frameElement), e.detail)
      ))
  })
})(window)
