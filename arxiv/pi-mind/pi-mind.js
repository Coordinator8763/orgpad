/*
 * Pi (personalised/pico) mind
 * (C) 2011-2015 Tomas 'tomby' Bily <tomby@ucw.cz>
 *
 * version: 0.5.5a-Barcelona (Wed Sep 23 23:48:16 CEST 2015)
 */

/*
 * Setters & Getters
 * http://ejohn.org/blog/javascript-getters-and-setters/
 * __defineGetter__, __defineSetter__ ...
 */

'use strict';

(function () {
  /// namespaces
  var svgns = "http://www.w3.org/2000/svg",
      xlink = "http://www.w3.org/1999/xlink",
      evns = "http://www.w3.org/2001/xml-events",

  /// Tools/utils
  // global constant functions
      emptyF = function () {},
      idF = function (x) { return x; },
      trueF = function () { return true; },
      falseF = function () { return false; };

  // console log
  var $consoleLog = function (msg) {
    if (console && console.log) {
      console.log (msg);
    }
  };

  // Lib name space
  window.PimLib = {};

  // State name space
  window.PimLocalState = {};

  // Simple class utils
  var $makeNS = function (ns) {
    var scope = window;

    for (var i = 0; i < ns.length; i++) {
      if (!(ns in scope))
	scope [ns] = {};
      scope = scope [ns];
    }

    return scope;
  };

  var $defClass = function (name, def) {
    var path = name.split (".");
    var clsName = path.pop ();
    var scope = $makeNS (path);
    var sup = def.extends || Object;

    scope [clsName] = def.constructor;
    scope [clsName].prototype = new sup ();
    $classMethods (scope [clsName], def);
  };

  var $classMethods = function (cls, methods) {
    for (var k in methods) {
      if (methods.hasOwnProperty (k)) {
	cls.prototype [k] = methods [k];
      }
    }
  };

  var updateMath = function (el) {
    if (window.MathJax) {
      if (el) {
        window.MathJax.Hub.Queue (["Typeset", window.MathJax.Hub, el]);
      } else {
        window.MathJax.Hub.Queue (["Typeset", window.MathJax.Hub]);
      }
    } else if (window.katex) {
      $each ($selectElements ('.math', el), function (mathEl) {
        var texTxt = mathEl.textContent, addDisp;
        if (mathEl.tagName === 'DIV') {
          addDisp = '\\displaystyle ';
        } else {
          addDisp = '';
        }
        try {
          katex.render(addDisp + texTxt, mathEl);
        }
        catch(err) {
          mathEl.innerHTML = "<span class='err'>" + err;
        }
      });
    }
  };

  // create element with attrs in ns
  var $createElement = function (ns, el, attr) {
    var key;
    if (attr) {
      if (ns) {
	for (key in attr)
	  if (attr.hasOwnProperty(key)) {
	    el.setAttributeNS (ns, key, String (attr[key]));
	  }
      } else {
	for (key in attr)
	  if (attr.hasOwnProperty(key)) {
	    el.setAttribute(key, String (attr[key]));
	  }
      }
    } else {
      return document.createElementNS(ns, el);
    }

    return el;
  };

  // create svg element
  var $createSVGElement = function (el, attr) {
    if (!attr)
      return $createElement (svgns, el, attr);
    $setAttrs (el, attr);
    return el;
  };

  // create attr xlink ns
  var $createXLinkAttr = function (el, attr) {
    $createElement (xlink, el, attr);
  };

  // create unique id
  var $UUID = function (prefix) {
    // http://www.ietf.org/rfc/rfc4122.txt
    var s = [],
	i = 0;
    for (; i < 32; i++) {
      s[i] = (~~(Math.random() * 16)).toString(16);
    }
    //// bits 12-15 of the time_hi_and_version field to 0010
    //s[12] = 4;
    //// bits 6-7 of the clock_seq_hi_and_reserved to 01
    //s[16] = ((s[16] & 3) | 8).toString(16);
    return prefix + "-" + s.join("");
  };

  // add node
  var $addNode = function (node1, node2) { node1.appendChild (node2); };

  //get attr
  var $getAttr = function (el, key) { return el.getAttribute (key); };
  var $setAttrs = function (el, attrs) { $createElement (null, el, attrs); return el;};
  // remove node
  var $removeNode = function (el) { if (el.parentNode) el.parentNode.removeChild (el); };

  // parents
  var $parents = function (el) {
    var parents = [];

    while (el && el !== document.body) {
      if (el.parentNode)
	parents.push (el.parentNode);
      el = el.parentNode;
    };

    return parents;
  };

  // defined predicate
  var $defined = function (x) { return typeof (x) !== 'undefined'; };

  // defined and non-null predicate
  var $definedNonNull = function (x) { return $defined (x) && x !== null; };

  // returns value if defined or undef alternative
  var $maybe = function (x, undef) {
    if ($defined (x))
      return x;
    return undef;
  };

  // create array and null items
  var $newArray = function (n) {
    var a = new Array (n);
    for (var i = n; i--;)
      a [i] = null;
    return a;
  };

  // time
  var $time = function () {
    return new Date().getTime();
  };

  // get cookie
  var $getCookie = function (name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split (';');
    for (var i=0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0)==' ')
	c = c.substring (1, c.length);
      if (c.indexOf (nameEQ) == 0)
	return c.substring (nameEQ.length,c.length);
    }

    return null;
  };

  // open new window
  var $openWinOld = function (hash, name, prefix) {
    prefix = prefix || window.location.toString ();
    return window.open (prefix + hash, name, "top=10,left=10,width=800,height=800,resizable=yes,fullscreen");
  };

  var $openWin = function (hash, name, prefix) {
    window.location.hash = "";

    prefix = window.location.toString ().replace ("#", "");
    var w = window.open (prefix + hash, name, "top=10,left=10,width=800,height=800,resizable=yes,fullscreen");

    window.PimContentToSaveSender = function () {
      w.postMessage(JSON.stringify (window.PimContentToSave), '*');
    };

    return w;
  };

  // stop propagation of event
  var $evtStop = function (ev) {
    if (ev.stopPropagation)
      ev.stopPropagation ();
    if (ev.preventDefault)
      ev.preventDefault ();
    ev.cancelBubble = true;
    ev.returnValue = false;
    return false;
  };

  /// bin search
  var binSearch = function (arr, val) {
    var h = arr.length, l = -1, m;

    while ((h - l) > 1) {
      if (arr [m = (h + l) >> 1] < val)
	l = m;
      else
	h = m;
    }

    if (h === arr.length)
      return [h - 1, h];
    if (arr [h] === val)
      return [h, h];
    if (arr [h] > val)
      return [h - 1, h];
    return [h, h + 1];
  };

  // object size
  var $olen = function (obj) {
    var size = 0, key;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) size++;
    }
    return size;
  };

  // for each
  var $each = function (arr, cb) {
    for (var i = 0; i < arr.length; i++)
      cb (arr [i]);
  };

  // map
  var $map = function (arr, cb) {
    var narr = new Array (arr.length);

    for (var i = arr.length; i--; )
      narr [i] = cb (arr [i]);

    return narr;
  };

  // map for maps
  var $mapMap = function (m, fn) {
    var nm = {};

    for (var i in m)
      nm [i] = fn (m [i]);

    return nm;
  };

  /**
   * Filter and map
   *
   * @param {Object} m map of objects
   * @param {Function (obj, idx)} fn filter-mapping function.
   *	      If returns null or false the object is not added to
   *	      selected items.
   * @param {Array} selection null or indices to filer
   */
  var $filterMap = function (m, fn, selection) {
    var i, o, r;
    var selected = [];

    for (i in m) {
      o = m [i];
      if ($definedNonNull (selection)) {
	if (selection.indexOf (i) === -1)
	  continue;
      }

      r = fn (o, i);
      if (r)
	selected.push (o);
    }

    return selected;
  };

  // fold
  var $fold = function (a, fn, init) {
    var ret = init;

    for (var i = 0; i < a.length; i++) {
      ret = fn (a [i], i, ret);
    }

    return ret;
  };

  // fold map
  var $foldMap = function (m, fn, init) {
    var ret = init;

    for (var i in m) {
      ret = fn (m [i], i, ret);
    }

    return ret;
  };

  var $range = function (from, to, step) {
    from = from || 0;
    to = to || 0;
    step = step || 1;

    var rng = [];

    for (var i = from; i < to; i += step)
      rng.push (i);

    return rng;
  };

  // generate new array
  var $genArray = function (n, cb) {
    var narr = new Array (n);

    for (var i = n; i--; )
      narr [i] = cb (i);

    return narr;
  };

  // merge two objects
  var $omerge = function (o1, o2, o3) {
    var i;

    if (o3) {
      for (i in o1)
	o3 [i] = o1 [i];
      for (i in o2)
	o3 [i] = o2 [i];
      return o3;
    } else {
      for (i in o2)
	o1 [i] = o2 [i];
      return o1;
    }
  };

  /**
   * Pick one function from container map
   *
   * @param first arg - function name/id
   * @param second arg - scope
   * @param third arg - map of functions
   * @param rest - rest arguments to function
   */
  var $pickf = function () {
    var args = Array.prototype.slice.call(arguments);
    var mid = args.shift (),
        self = args.shift (),
        fcions = args.shift ();
    if (mid in fcions) {
      var f = fcions [mid];
      return f.apply (self, args);
    }
    return null;
  };

  // map template
  var $mapTemplate = function (str, vars) {
    var s = str;
    for (var i in vars) {
      var r = new RegExp ("%\\{" + i + "\\}", "g");
      s = s.replace (r, vars[i]);
    }
    return s;
  };

  // html
  var $getElementById = function (id) {
    return document.getElementById (id);
  };

  var $createHTMLElement = function (el) {
    return document.createElement (el);
  };

  var $selectElements = function (selector, el) {
    el = el || document;
    return $map (el.querySelectorAll (selector), idF);
  };

  var $addClass = function (el, cls) {
    el.classList.add (cls);
  };

  var $removeClass = function (el, cls) {
    el.classList.remove (cls);
  };

  var $toggleClass = function (el, cls) {
      el.classList.toggle (cls);
    };

  var $hasClass = function (el, cls) {
    return el.classList.contains (cls);
  };

  // dom
  var $addEventHandler = function (el, event, handler) {
    if (el.addEventListener)
      el.addEventListener (event, handler, false);
    else
      el.attachEvent ("on"+event, handler);
  };

  var visibilityCache = {};

  var $hide = function (el) {
    if (el.style && el.style.display !== 'none') {
      if (el.style.display !== '')
	visibilityCache [el] = el.style.display;
      el.style.display = 'none';
    }
  };

  var $show = function (el) {
    if (el.style && el.style.display === 'none') {
      if (el in visibilityCache)
	el.style.display = visibilityCache [el];
      else
	el.style.display = 'inline';
    }
  };

  var $toggleVisibility = function (el) {
    if (el.style && el.style.display === 'none')
      $show (el);
    else
      $hide (el);
  };

  var $position = function (el, x ,y) {
    el.style.position = "absolute";
    el.style.top = y + "px";
    el.style.left = x + "px";
  };

  // move element as a last child of the parent
  var $asLast = function (el) {
    if (!el.parentNode) return;

    var p = el.parentNode;
    $addNode (p, el);
  };

  // move element as a first child of the parent
  var $asFirst = function (el) {
    if (!el.parentNode) return;

    var p = el.parentNode;
    p.insertBefore (el, p.firstChild);
  };

  // svg
  var $SVGCanvas = function (pel, x, y, width, height) {
    var paper = $createSVGElement ("svg");
    $createSVGElement (paper, {
      xmlns: svgns,
      "xmlns:xlink": xlink,
      "xmlns:ev": evns,
      baseProfile: "full",
      version: 1.1,
      width: width,
      height: height,
      x: x,
      y: y
    });
    $addNode (pel, paper);
    return paper;
  };

  var $SVGRect = function (x, y, w, h) {
   var r = $createSVGElement ("rect");
   $createSVGElement (r, {
     //id: $UUID ("svrect"),
     x: x, y: y,
     width: w, height: h
   });

   return r;
 };

  var $SVGForeignObj = function (obj, x, y, w, h) {
    var fo = $createSVGElement ("foreignObject");
    $createSVGElement (fo, {
      //id: $UUID ("svfo"),
      x: x, y: y,
      width: w, height: h
    });

    $addNode (fo, obj);
    return fo;
  };

  var $SVGgNode = function (objs) {
    var g = $createSVGElement ("g");

    //$createSVGElement (g, {id: $UUID ("svgr")});

    if ($defined (objs)) {
      var l = objs.length;
      for (var i = 0; i < l; i++) {
	$removeNode (objs [i]);
	$addNode (g, objs [i]);
      }
    }

    return g;
  };

  var $SVGClip = function (x, y, w, h, rx, ry, rw) {
    var cp = $createSVGElement ("clipPath");
    var cr = $SVGRect (x, y, w, h);

    $createSVGElement (cp, {id: $UUID ("cp")});
    $createSVGElement (cr, { rx: rx, ry: ry, 'stroke-width': rw });
    $addNode (cp, cr);
    return cp;
  };

  var $SVGRef = function (id) {
    return "url(#" + id + ")";
  };

  var $SVGUnref = function (s) {
    var id = s.match (/url\(\"*\#(.*?)\"*\)/);
    if (id) return id [1];
    return s;
  };

  var $SVGPath = function (desc) {
    var pth = $createSVGElement ("path");
    $createSVGElement (pth, { /*id: $UUID ("cp"),*/ d: desc, "stroke-linecap": "round" });
    return pth;
  };

  var $SVGMark = function (color) {
    var m = $createSVGElement ("marker");
    $createSVGElement (m, {id: $UUID ("marker"),
		           viewBox:"0 0 10 10" ,refX:"0", refY:"5",
		           markerUnits:"strokeWidth",
		           markerWidth:"4", markerHeight:"3",
		           orient:"auto", fill: color
		          });

    var p = $SVGPath ("M 0 0 L 10 5 L 0 10 z");

    $addNode (m, p);
    return m;
  };

  /// system stuff
  var __getIEVersion = function () {
    var rv = -1; // Return value assumes failure.
    if (navigator.appName == 'Microsoft Internet Explorer') {
      var ua = navigator.userAgent;
      var re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
      if (re.exec(ua) != null)
	rv = parseFloat(RegExp.$1);
    }
    return rv;
  };

  var __getOperaVersion = function () {
    var rv = 0; // Default value
    if (window.opera) {
      var sver = window.opera.version();
      rv = parseFloat(sver);
    }
    return rv;
  };

  var __userAgent = navigator.userAgent;
  var __isIE =  navigator.appVersion.match(/MSIE/) != null;
  var __IEVersion = __getIEVersion();
  var __isIENew = __isIE && __IEVersion >= 8;
  var __isIEOld = __isIE && !__isIENew;

  var __isFireFox = __userAgent.match(/firefox/i) != null;
  var __isFireFoxOld = __isFireFox && ((__userAgent.match(/firefox\/2./i) != null) ||
				       (__userAgent.match(/firefox\/1./i) != null));
  var __isFireFoxNew = __isFireFox && !__isFireFoxOld;

  var __isWebKit =  navigator.appVersion.match(/WebKit/) != null;
  var __isChrome =  navigator.appVersion.match(/Chrome/) != null;
  var __isOpera =  window.opera != null;
  var __operaVersion = __getOperaVersion();
  var __isOperaOld = __isOpera && (__operaVersion < 10);

  var __parseBorderWidth = function (width) {
    var res = 0;
    if (typeof(width) == "string" && width != null && width != "" ) {
      var p = width.indexOf("px");
      if (p >= 0) {
	res = parseInt(width.substring(0, p));
      }
      else {
	//do not know how to calculate other values
	//(such as 0.5em or 0.1cm) correctly now
	//so just set the width to 1 pixel
	res = 1;
      }
    }
    return res;
  };

  //returns border width for some element
  var __getBorderWidth = function (element) {
    var res = new Object();
    res.left = 0; res.top = 0; res.right = 0; res.bottom = 0;
    if (window.getComputedStyle) {
      //for Firefox
      var elStyle = window.getComputedStyle(element, null);
      res.left = parseInt(elStyle.borderLeftWidth.slice(0, -2));
      res.top = parseInt(elStyle.borderTopWidth.slice(0, -2));
      res.right = parseInt(elStyle.borderRightWidth.slice(0, -2));
      res.bottom = parseInt(elStyle.borderBottomWidth.slice(0, -2));
    }
    else {
      //for other browsers
      res.left = __parseBorderWidth(element.style.borderLeftWidth);
      res.top = __parseBorderWidth(element.style.borderTopWidth);
      res.right = __parseBorderWidth(element.style.borderRightWidth);
      res.bottom = __parseBorderWidth(element.style.borderBottomWidth);
    }

    return res;
  };

  //
  var f_clientSize = function () {
    var myWidth = 0, myHeight = 0;
    if( typeof( window.innerWidth ) == 'number' ) {
      //Non-IE
      myWidth = window.innerWidth;
      myHeight = window.innerHeight;
    } else if (document.documentElement &&
	       ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) {
      //IE 6+ in 'standards compliant mode'
      myWidth = document.documentElement.clientWidth;
      myHeight = document.documentElement.clientHeight;
    } else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) {
      //IE 4 compatible
      myWidth = document.body.clientWidth;
      myHeight = document.body.clientHeight;
    }
    return [myWidth, myHeight];
  };

  var f_clientWidth = function () {
    return f_clientSize () [0];
  };

  var f_clientHeight = function () {
    return f_clientSize () [1];
  };

  var f_clientScroll = function () {
    var scrOfX = 0, scrOfY = 0;
    if( typeof( window.pageYOffset ) == 'number' ) {
      //Netscape compliant
      scrOfY = window.pageYOffset;
      scrOfX = window.pageXOffset;
    } else if( document.body && ( document.body.scrollLeft || document.body.scrollTop ) ) {
      //DOM compliant
      scrOfY = document.body.scrollTop;
      scrOfX = document.body.scrollLeft;
    } else if( document.documentElement
	    && ( document.documentElement.scrollLeft || document.documentElement.scrollTop ) ) {
      //IE6 standards compliant mode
      scrOfY = document.documentElement.scrollTop;
      scrOfX = document.documentElement.scrollLeft;
    }
    return [ scrOfX, scrOfY ];
  };

  var f_scrollLeft = function () {
    return f_clientScroll () [0];
  };

  var f_scrollTop = function () {
    return f_clientScroll () [1];
  };

  //returns the absolute position of some element within document
  var getElementAbsolutePos = function (element) {
    var res = new Object();
    res.x = 0; res.y = 0;
    if (element !== null) {
      if (element.getBoundingClientRect) {
	var box = element.getBoundingClientRect();

	res.x = box.left + f_scrollLeft ();
	res.y = box.top + f_scrollTop ();
      }
      else { //for old browsers
	res.x = element.offsetLeft;
	res.y = element.offsetTop;

	var parentNode = element.parentNode;
	var borderWidth = null;
	var offsetParent = element.offsetParent;

	while (offsetParent != null) {
	  res.x += offsetParent.offsetLeft;
	  res.y += offsetParent.offsetTop;

	  var parentTagName =
	      offsetParent.tagName.toLowerCase();

	  if ((__isIEOld && parentTagName != "table") ||
	      ((__isFireFoxNew || __isChrome) &&
	       parentTagName == "td")) {
	    borderWidth = __getBorderWidth
	    (offsetParent);
	    res.x += borderWidth.left;
	    res.y += borderWidth.top;
	  }

	  if (offsetParent != document.body &&
	      offsetParent != document.documentElement) {
	    res.x -= offsetParent.scrollLeft;
	    res.y -= offsetParent.scrollTop;
	  }


	  //next lines are necessary to fix the problem
	  //with offsetParent
	  if (!__isIE && !__isOperaOld || __isIENew) {
	    while (offsetParent != parentNode &&
		   parentNode !== null) {
	      res.x -= parentNode.scrollLeft;
	      res.y -= parentNode.scrollTop;
	      if (__isFireFoxOld || __isWebKit)
	      {
		borderWidth =
		  __getBorderWidth(parentNode);
		res.x += borderWidth.left;
		res.y += borderWidth.top;
	      }
	      parentNode = parentNode.parentNode;
	    }
	  }

	  parentNode = offsetParent.parentNode;
	  offsetParent = offsetParent.offsetParent;
	}
      }
    }
    return res;
  };

  // mouse buttons
  var MOUSE_BUTTON_LEFT, MOUSE_BUTTON_RIGHT;

  if (__isIENew || __isIEOld) {
    MOUSE_BUTTON_LEFT = 1;
    MOUSE_BUTTON_RIGHT = 2;
  } else {
    MOUSE_BUTTON_LEFT = 0;
    MOUSE_BUTTON_RIGHT = 2;
  }

  //FF doesn't recognize mousewheel as of FF3.x
  var MOUSE_WHEEL_EVT_NAME = (/Firefox/i.test(navigator.userAgent))
	                   ? "DOMMouseScroll" : "mousewheel";

  var mouseNormalizeWheelData = function (evt) {
    return evt.detail ? evt.detail * (-120) : evt.wheelDelta;
  };

  /// PimSystem
  window.PimSystem = function () {
  };

  PimSystem.prototype.createSVGElementOrAttr = $createSVGElement;

  PimSystem.prototype.getAttribute = $getAttr;

  // global system variable
  window.PimSYSTEM = new PimSystem ();

  /// PimBinHeap
  /*
   * 0
   * 1 2
   * 3 4  5 6
   * 7 8  9 10 11 12 13 14
   */
  $defClass ("PimBinHeap", {

    constructor: function () {
      this.heap = [];
    },

    up: function (i) {
      var pi = i ? (i - 1) >> 1 : 0;
      var x = this.heap [i];
      var y = this.heap [pi];

      while ((x.val <  y.val) && (i > 0)) {
	this.heap [i] = y;
	this.heap [pi] = x;
	i = pi;
	pi = i ? (i - 1) >> 1 : 0;
	y = this.heap [pi];
      }
    },

    down: function (i) {
      var pi = (i << 1) + 1;
      var x = this.heap [i];
      var y, z, l = this.heap.length;

      while (pi < l) {
	y = this.heap [pi];
	if ((pi + 1) === l)
	  z = y;
	else
	  z = this.heap [pi + 1];

	if (y.val <= z.val) {
	  if (x.val <= y.val)
	    break;
	} else {
	  if (x.val < z.val)
	    break;
	  y = z;
	  pi += 1;
	}

	this.heap [i] = y;
	this.heap [pi] = x;
	i = pi;
	pi = (i << 1) + 1;
      }
    },

    insert: function (val, obj) {
      this.heap.push ({val: val, obj: obj});
      this.up (this.heap.length - 1);
    },

    top: function () {
      if (!this.heap.length) return null;
      return this.heap [0];
    },

    popTop: function () {
      var l = this.heap.length;
      if (!l) return null;
      var top = this.heap [0];
      this.heap [0] = this.heap [l - 1];
      this.heap.pop ();
      this.down (0);
      return top;
    },

    isEmpty: function () {
	return this.heap.length === 0;
      },

    size: function () {
      return this.heap.length;
    }
  });

  /// PimTask
  /**
   * onInit (task) - return delay in ms to next call
   * onNext (task) - return delay in ms to next call
   * onLeave (task)
   */
  $defClass ("PimTask", {
    constructor: function (handlers) {
      this.onInitHdl = emptyF;
      this.onNextHdl = emptyF;
      this.onLeaveHdl = emptyF;
      this.stopped = false;
      this.time = -1;
      this.tid = -1;

      this.init = function () {
	if ('onInit' in handlers)
	  this.onInitHdl = handlers.onInit;
	if ('onNext' in handlers)
	  this.onNextHdl = handlers.onNext;
	if ('onLeave' in handlers)
	  this.onLeaveHdl = handlers.onLeave;
      };

      this.init ();
    },

    onInit: function () {
      if (this.stopped) return 100;
      return this.onInitHdl (this);
    },

    onNext: function () {
      if (this.stopped) return 100;
      return this.onNextHdl (this);
    },

    onLeave: function () {
      if (this.stopped) return;
      this.onLeaveHdl (this);
    },

    getTime: function () {
      return this.time;
    },

    setTime: function (t) {
      this.time = t;
    },

    setTid: function (tid) {
      this.tid = tid;
    },

    getTid: function () {
      return this.tid;
    },

    stop: function (stopped) {
      this.stopped = stopped;
    },

    isStopped: function () {
      return this.stopped;
    }
  });

  /// PiScheduler
  $defClass ("PimScheduler", {
    constructor: function (sid, idleTime) {
      var ptr = this;
      this.tqueue = null;
      this.time = 0;
      this.future = 0;
      this.gtid = 0;
      this.sid = -1;
      this.tid = -1;
      this.idleTime = -1;

      this.init = function () {
	this.tqueue = new PimBinHeap ();
	if ($defined (sid))
	  this.sid = sid;
	if ($defined (idleTime))
	  this.idleTime = idleTime;
      };

      this.thandler = function () {
	var i;
	var x = ptr.tqueue.top ();

	while (x && (x.val <= ptr.future)) {
	  var next = x.obj.onNext ();
	  ptr.tqueue.popTop ();
	  if (next === -1) {
	    x.obj.onLeave ();
	  } else {
	    x.obj.setTime (ptr.future + next);
	    ptr.tqueue.insert (ptr.future + next, x.obj);
	  }

	  x = ptr.tqueue.top ();
	}

	ptr.time = ptr.future;
	if (ptr.tqueue.isEmpty ()) {
	  window.setTimeout (function () { ptr.thandler (); }, ptr.idleTime);
	} else {
	  ptr.future = ptr.tqueue.top ().val;
	  window.setTimeout (function () { ptr.thandler (); }, ptr.future - ptr.time);
	}
      };

      this.init ();
    },

    start: function () {
      var ft = 1, ptr = this;
      if (!this.tqueue.isEmpty ())
	ft = this.tqueue.top ().obj.getTime () - this.time;
      if (ft < 0)
	ft = 1;
      this.tid = window.setTimeout (function () { ptr.thandler (); }, ft);
      this.future = this.time + ft;
    },

    stop: function () {
      clearTimeout (this.tid);
    },

    addTask: function (task) {
      var tid = this.gtid, nt;
      this.gtid += 1;
      nt = this.time + task.onInit ();
      task.setTime (nt);
      this.tqueue.insert (nt, task);
    }
  });

  /// PimObservable

  $defClass ("PimObservable", {
    constructor: function () {
      this.eventHandlers = {};
      this.gehIds = 0;
      this.blocked = false;
      this.returnContainer = {};
    },

    setEventHandlers: function (eHandlers) {
      this.eventHandlers = eHandlers;
    },

    addHandler: function (evId, hdl) {
      var ehId = -1;
      if (evId in this.eventHandlers) {
	if (this.eventHandlers [evId].indexOf (hdl) === -1) {
	  ehId = this.gehIds;
	  this.gehIds += 1;
	  this.eventHandlers [evId].push ([hdl, ehId]);
	}
      } else {
	ehId = this.gehIds;
	this.gehIds += 1;
	this.eventHandlers [evId] = [[hdl, ehId]];
      }

      return ehId;
    },

    addHandlers: function (handlers) {
      var hids = {};

      for (var i in handlers)
	hids [i] = this.addHandler (i, handlers [i]);

      return hids;
    },

    removeHandler: function (evId, ehId) {
      if (!(evId in this.eventHandlers)) return false;

      var hdls = this.eventHandlers [evId];
      for (var i = hdls.length; i--; ) {
	if (hdls [i] [1] === ehId) {
	  hdls.splice (i, 1);
	  return true;
	}
      }

      return false;
    },

    sendEvent: function (evId, msg) {
      if (!(evId in this.eventHandlers)) return;

      var hdls = this.eventHandlers [evId];
      for (var i = hdls.length; i--; ) {
	var f	= hdls [i][0];
	f (this, msg);
      }
    },

    sendEventBlocked: function (evId, msg) {
     if (this.blocked) return;
     if (!(evId in this.eventHandlers)) return;

     this.blocked = true;
     var hdls = this.eventHandlers [evId];
     for (var i = hdls.length; i--; ) {
       var f = hdls [i][0];
       f (this, msg);
     }
     this.blocked = false;
   },

    // merge parameter object with current returnContainer
    setReturnContainer: function (cont) {
      $omerge (this.returnContainer, cont);
    },

    // return current content of return container and empty it
    getReturnContainer: function () {
      var c = this.returnContainer;
      this.returnContainer = {};
      return c;
    }
  });

  /// PimState
  /**
   * state: { onEnter, onLeave, data }
   */
  $defClass ("PimState", {
    "extends": PimObservable,

    constructor: function (states, initState) {
      PimObservable.call (this);

      this.currentState = null;
      this.states = null;
      this.fixed = false;

      this.init = function () {
	if ($defined (states))
	  this.states = states;
	else
	  this.states = {};

	if ($defined (initState))
	  this.setCurrentState (initState);
      };

      this.init ();
    },

    setCurrentState: function (state, data) {
      // if (this.fixed) return;
      if (this.currentState === state) return;
      // if (!(state in this.states)) return;

      if ($definedNonNull (this.currentState))
	if ('onLeave' in this.states [this.currentState])
	  this.states [this.currentState].onLeave (this,
						   this.currentState,
						   state);

      if ($definedNonNull (state))
	if ('onEnter' in this.states [state])
	  this.states [state].onEnter (this, this.currentState, state);

      this.sendEvent ('changeState', {oldState: this.currentState,
				      newState: state,
				      data: data});
      this.currentState = state;
    },

    getCurrentState: function () {
      return this.currentState;
    },

    getCurrentStateData: function () {
      if (!this.currentState) return null;

      if ('data' in this.states [this.currentState])
	return this.states [this.currentState].data;
      return null;
    },

    setCurrentStateData: function (ndata) {
      if (!this.currentState) return;

      this.states [this.currentState].data = ndata;
      this.sendEvent ('setStateData', {data: ndata});
    },

    insertState: function (stateId, handlers, merge) {
      if (!(stateId in this.states))
	this.states [stateId] = {};

      // maybe if we are setting current state leave old handler
      // and enter new ??
      if ($defined (merge) && merge) {
	$omerge (this.states [stateId], handlers);
      } else {
	this.states [stateId] = handlers;
      }
      this.sendEvent ('setState', {id: stateId, def: handlers});
    },

    setStateData: function (stateId, data) {
      if (stateId in this.states) {
	this.states [stateId].data = data;
	this.sendEvent ('setStateData', {data: data});
      }
    },

    getStateData: function (stateId) {
      if (stateId in this.states && 'data' in this.states [stateId])
	return this.states [stateId].data;

      return null;
    },

    setStateAttr: function (stateId, attr, value) {
      if (stateId in this.states) {
	if (!this.states [stateId].attrs)
	  this.states [stateId].attrs = {};
	this.sendEvent ('setStateAttr', {attr: attr, value: value});
	this.states [stateId].attrs [attr] = value;
      }
    },

    setStateAttrs: function (attr, vals) {
      for (var i in vals)
	this.setStateAttr (i, attr, vals [i]);
    },

    updateStateAttrs: function (stateId) {
      var attrs = this.getStateAttrs (stateId);

      for (var i in attrs) {
	this.sendEvent ('updateStateAttr',
			{stateId: stateId, attr: i, value: attrs[i]});
	this.setStateAttr (stateId, i, attrs [i]);
      }
    },

    updateStateAttr: function (stateId, attr, val) {
      var attrs = this.getStateAttrs (stateId);
      var v = val || attrs [attrs];

      this.sendEvent ('updateStateAttr',
		      {stateId: stateId, attr: attr, value: v});
      this.setStateAttr (stateId, attr, v);
    },

    getStateAttr: function (stateId, attr) {
      if (stateId in this.states && 'attrs' in this.states [stateId]
		                 && attr in this.states [stateId].attrs)
	return this.states [stateId].attrs [attr];

      return null;
    },

    getStateAttrs: function (stateId) {
      if (stateId in this.states && 'attrs' in this.states [stateId])
	return this.states [stateId].attrs;

      return null;
    },

    isState: function (stateId) {
      return stateId in this.states;
    },

    setFixed: function (fixed) {
      this.fixed = fixed;
    },

    getFixed: function () {
      return this.fixed;
    },

    foldData: function (fn, init) {
      var ret = init;

      for (var i in this.states) {
	if (this.states [i].data)
	  ret = fn (this.states [i].data, ret);
      }

      return ret;
    },

    foldAttrs: function (fn, init) {
      var ret = init;

      for (var i in this.states) {
	if (this.states [i].attrs)
	  ret = fn (this.states [i].attrs, ret);
      }

      return ret;
    },

    toJSON: function () {
      var jdata = {}, jattr = {};

      for (var i in this.states) {
	if (this.states [i].data)
	  jdata [i] = escape (this.states [i].data);
	if (this.states [i].attrs)
	  jattr [i] = this.states [i].attrs;
      }

      return {data: jdata, attrs: jattr, fixed: this.fixed || false};
    },

    fromJSON: function (json) {
      var i;

      for (i in json.data)
	this.insertState (i, {data: unescape (json.data [i])});
      for (i in json.attrs)
	this.insertState (i, {attrs: json.attrs [i]}, true);

      this.setFixed (json.fixed || false);
    }
  });

  /// PimNode
  $defClass ("PimNode", {
    "extends": PimState,

    constructor: function () {
      PimState.call (this);
      this.nedges = [];
    },

    addEdge: function (e) {
      if (this.nedges.indexOf (e) === -1) {
	this.sendEvent ('addEdge', { edge: e });
	this.nedges.push (e);
      }
    },

    forEachEdge: function (cb) {
      $each (this.nedges, cb);
    }
  });



  /// PimEdge
  $defClass ("PimEdge", {
    "extends": PimState,

    constructor: function () {
      PimState.call (this);
      this.nodes = [null, null];
    },

    setNode: function (n, id) {
      this.nodes [id] = n;
      n.addEdge (this);
      this.sendEvent ('setNode', { node: n, id: id });
    },

    getNode: function (id) {
      return this.nodes [id];
    },

    getOtherNode: function (n) {
      return (n === this.nodes [0]) ? this.nodes [1] : this.nodes [0];
    },

    forEachNode: function (cb) {
      $each (this.nodes, cb);
    }
  });

  /// PimGraph

  var updateLen = function (cont, id, inc) {
    inc = inc || 1;
    id = id || 0;

    if (cont.length <= id)
      cont.length = id + inc;
    else
      cont.length += inc;
  };

  var maxKey = function (obj) {
    var max = -1, key;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
	key = parseInt (key);
	if (key > max) max = key;
      }
    }
    return max;
  };

  $defClass ("PimGraph", {
    "extends": PimState,

    constructor: function () {
      PimState.call (this);
      this.reset ();
    },

    reset: function () {
      this.nodes = {};
      // this.nodes.length = 0;
      this.edges = {};
      // this.edges.length = 0;
    },

    addNode: function (n, _nid) {
      var nid = $maybe (_nid, maxKey (this.nodes) + 1);
      // updateLen (this.nodes, _nid);
      n.nid = nid;
      this.nodes [nid] = n;
      this.sendEvent ('addNode', {node: n});
      return nid;
    },

    addEdge: function (e, _eid) {
      var eid = $maybe (_eid, maxKey (this.edges) + 1);
      // updateLen (this.edges, _eid);
      e.eid = eid;
      this.edges [eid] = e;
      this.sendEvent ('addEdge', {edge: e});
      return eid;
    },

    removeNode: function (nid) {
      var tmp = this.nodes [nid];
      delete this.nodes [nid];
      this.sendEvent ('removeNode', {node: tmp, nid: nid});
      return tmp;
    },

    removeEdge: function (eid) {
      var tmp = this.edges [eid];
      delete this.edges [eid];
      this.sendEvent ('removeEdge', {edge: tmp, eid: eid});
      return tmp;
    },

    getNode: function (nid) {
      return this.nodes [nid];
    },

    getNodes: function () {
      return this.nodes;
    },

    getEdge: function (eid) {
      return this.edges [eid];
    },

    getEdges: function () {
      return this.edges;
    },

    getMaxNodes: function () {
      return maxKey (this.nodes) + 1;
    },

    getMaxEdges: function () {
      return maxKey (this.edges) + 1;
    }
  });

  /// PimDataModel
  $defClass ("PimDataModel", {
    "extends": PimObservable,

    constructor: function () {
      PimObservable.call (this);

      var ptr;

      this.graph = null;

      this.init = function () {
	this.graph = new PimGraph ();
      };

      this.init ();
    },

    /**
     * @param
     *   sid - state id
     *   data - data
     *
     * @return data id (did)
     */
    setSData: function (did, sid, data) {
      var node = this.graph.getNode (did);
      var state = node;

      if (typeof (data) === 'object'
	&& ('onLeave' in data || 'onEnter' in data))
	state.insertState (sid, data, true);
      else
	state.insertState (sid, {data: data}, true);
      this.sendEvent ('setData', {did: did, sid: sid,
				  data: data});
    },

    addData: function (datas, did) {
      var node = new PimNode ();
      var nid = this.graph.addNode (node, did);

      if ($definedNonNull (datas))
	for (var i in datas) {
	  this.addSData (nid, i, datas [i]);
	};

      this.sendEvent ('addData', {data: datas});
      return nid;
    },

    removeData: function (did) {
      var data = this.graph.removeNode (did);
      this.sendEvent ('removeData', {data: data,
				     did: did});
      return data;
    },

    /**
     * @param
     *  did - data id
     *  sid - state id
     *
     * @return data
     */
    getSData: function (did, sid) {
      var node = this.graph.getNode (did);
      return node.getStateData (sid);
    },

    getData: function (did) {
      var node = this.graph.getNode (did);
      return node.getCurrentStateData ();
    },

    getDatas: function (did, sids) {
      var datas = {};

      for (var i = sids.length; i--;) {
	datas [sids [i]] = this.getSData (did, sids [i]);
      }

      return datas;
    },

    setDataState: function (did, sid) {
      var node = this.graph.getNode (did);
      node.setCurrentState (sid);
      this.sendEvent ('setDataState', {did: did, sid: sid});
    },

    getDataLinks: function (did) {
      var node = this.graph.getNode (did);
      var edges = node.getEdges ();
      var lids = [];

      node.forEachEdge (function (e) { lids.push (e.eid); });
      return lids;
    },

    setLinkData: function (lid, sid, data) {
      var edge = this.graph.getEdge (lid);
      var state = edge;

      state.insertState (sid, {data: data}, true);
      this.sendEvent ('setLinkData', {lid: lid, sid: sid, data:data});
    },

    linkData: function (did1, did2, datas, _lid) {
      var e = new PimEdge ();
      var n1 = this.graph.getNode (did1), n2 = this.graph.getNode (did2);
      var lid = this.graph.addEdge (e, _lid);

      e.setNode (n1, 0); e.setNode (n2, 1);
      if ($definedNonNull (datas))
	for (var i in datas) {
	  this.setLinkData (lid, i, datas [i]);
	}

      this.sendEvent ('linkData', {did1: did1, did2: did2, data:datas});
      return lid;
    },

    unlinkData: function (lid) {
      var link = this.graph.removeEdge (lid);
      this.sendEvent ('linkData', {lid: lid, data:link});
      return link;
    },

    getLinkData: function (lid, sid) {
      var edge = this.graph.getEdge (lid);
      return edge.getStateData (sid);
    },

    setLinkState: function (lid, sid) {
      var edge = this.graph.getEdge (lid);
      edge.setCurrentState (sid);
      this.sendEvent ('setLinkState', {lid: lid, sid: sid});
    },

    getLinkedData: function (lid) {
      var edge = this.graph.getEdge (lid);
      return [edge.getNode (0).nid, edge.getNode (1).nid];
    },

    dataToJSON: function (did) {
      return this.graph.getNode (did).toJSON ();
    },

    linkToJSON: function (lid) {
      return this.graph.getEdge (lid).toJSON ();
    },

    getMaxDid: function () {
      return this.graph.getMaxNodes ();
    },

    getMaxLid: function () {
      return this.graph.getMaxEdges ();
    },

    toJSON: function (selection) {
      var i, e,
	  data = {},
	  link = {};

      for (i in this.graph.nodes) {
	e = this.graph.getNode (i);
	if (typeof (e) === 'object') {
	  if ($definedNonNull (selection)) {
	    if (selection.indexOf (parseInt (i)) == -1)
	      continue;
	  }
	  data [i] = e.toJSON ();
	}
      }

      for (i in this.graph.edges) {
	e = this.graph.getEdge (i);
	if (typeof (e) === 'object') {
	  if ($definedNonNull (selection)) {
	    if (selection.indexOf (e.getNode (0).nid) == -1
	      ||	 selection.indexOf (e.getNode (1).nid) == -1)
	      continue;
	  }
	  link [i] = { nid1: e.getNode (0).nid,
		       nid2: e.getNode (1).nid,
		       data: this.graph.getEdge (i).toJSON () };
	}
      }

      return {datas: data, links: link};
    },

    fromJSON: function (json, base) {
      var i, n;
      var b = base || 0;

      for (i in json.datas) {
	n = this.addData (null, parseInt (i) + b);
	this.graph.getNode (n).fromJSON (json.datas [i]);
      }

      for (i in json.links) {
	n = this.linkData (parseInt (json.links [i].nid1) + b,
			   parseInt (json.links [i].nid2) + b,
                           null,
			   parseInt (i));
	this.graph.getEdge (n).fromJSON (json.links [i].data);
      }
    },

    filterData: function (fn, selection) {
      return $filterMap (this.graph.getNodes (), fn, selection);
    },

    clean: function () {
      this.graph.reset ();
    }
  });

  /// PimModeObservable

  $defClass ("PimModeObservable", {
    "extends": PimState,

    constructor: function () {
      PimState.call (this);

      var ptr = this;

      this.init = function () {
      };

      this.changeMode = function (state, oldState, newState) {
	var handlers = ptr.getStateData (newState) || {};
	ptr.setEventHandlers ({});
	for (var i in handlers)
	  ptr.addHandler (i, handlers [i]);
      };

      this.init ();
    },

    addModeHandlers: function (mode, handlers) {
      var state = this;

      if (!state.isState (mode))
	state.insertState (mode,
			   {onEnter: this.changeMode, data: handlers});
      else {
	var data = state.getStateData (mode) || {};

	$omerge (data, handlers);
	state.setStateData (mode, data);
      }
    },

    setMode: function (mode) {
      this.setCurrentState (mode);
    }
  });

  /// PimEventFeeder
  $defClass ("PimEventFeeder", {
    "extends": PimModeObservable,

    constructor: function (efid) {
      PimModeObservable.call (this);

      var ptr = this;
      this.efid = efid;
      this.elems = [];
      this.refs = [];
      this.stop = true;

      this.init = function () {
      };

      this.emitEv = function (name, ev) {
	var e = ev || window.event;
	ptr.sendEvent (name, {event: e, feeder: ptr});
	ptr.sendEvent ('allEvents', {name: name, event: e, feeder: ptr});
	if (this.stop && !ev.PimNoStop)
	  return $evtStop (ev);
	else
	  ev.PimNoStop = true;
	return null;
      };

      this.onClick = function (ev) {
	return ptr.emitEv ('click', ev);
      };

      this.onDblClick = function (ev) {
	return ptr.emitEv ('dblclick', ev);
      };

      this.onMouseOut = function (ev) {
	return ptr.emitEv ('mouseout', ev);
      };

      this.onMouseOver = function (ev) {
	return ptr.emitEv ('mouseover', ev);
      };

      this.onMouseMove = function (ev) {
	return ptr.emitEv ('mousemove', ev);
      };

      this.onMouseDown = function (ev) {
	return ptr.emitEv ('mousedown', ev);
      };

      this.onMouseUp = function (ev) {
	return ptr.emitEv ('mouseup', ev);
      };

      this.onKeyPress = function (ev) {
	return ptr.emitEv ('keypress', ev);
      };

      this.onKeyDown = function (ev) {
	return ptr.emitEv ('keydown', ev);
      };

      this.onKeyUp = function (ev) {
	return ptr.emitEv ('keyup', ev);
      };

      this.onMouseWheel = function (ev) {
	return ptr.emitEv ('mousewheel', ev);
      };

      this.init ();

    },

    addElement: function (el, ref) {
      this.elems.push (el);
      this.refs.push (ref);

      $addEventHandler (el, 'click',	 this.onClick);
      $addEventHandler (el, 'dblclick', this.onDblClick);
      $addEventHandler (el, 'keydown',	 this.onKeyDown);
      $addEventHandler (el, 'keypress', this.onKeyPress);
      $addEventHandler (el, 'keyup',	 this.onKeyUp);
      $addEventHandler (el, 'mousedown',this.onMouseDown);
      $addEventHandler (el, 'mousemove',this.onMouseMove);
      $addEventHandler (el, 'mouseout', this.onMouseOut);
      $addEventHandler (el, 'mouseover',this.onMouseOver);
      $addEventHandler (el, 'mouseup',  this.onMouseUp);
      $addEventHandler (el, MOUSE_WHEEL_EVT_NAME,  this.onMouseWheel);
    },

    getElemsRef: function (el) {
      var i = this.elems.indexOf (el);
      if (i === -1) return i;
      return this.refs [i];
    },

    addHandlerClickOrDblClick: function (cbClick, cbDblClick) {
      var dblclick = false;
      var clicked = false;
      var msg = null;
      var ptr = this;

      this.addHandler ('click', function (e, m) {
	msg = m;
	if (!clicked) {
	  clicked = true;
	  window.setTimeout (function () {
	    if (dblclick) {
	      cbDblClick (ptr, msg);
	      dblclick = false;
	    } else {
	      cbClick (ptr, msg);
	    }
	    clicked = false;
	  }, 200); // magic constant: need to be polished
	}
      });

      this.addHandler ('dblclick', function (e, m) {
	msg = m;
	dblclick = true;
      });
    }
  });

  /// PimEventFeederState

  $defClass ("PimEventFeederState", {
    "extends": PimObservable,

    constructor: function (eventFeeder) {
      PimObservable.call (this);

      var ptr = this;

      ptr.eventFeeder = eventFeeder;

      ptr.mouseXScreen = 0;
      ptr.mouseYScreen = 0;
      ptr.mouseXLocal = 0;
      ptr.mouseYLocal = 0;
      ptr.mouseXPage = 0;
      ptr.mouseYPage = 0;

      ptr.lastMouseXScreen = 0;
      ptr.lastMouseYScreen = 0;
      ptr.lastMouseXLocal = 0;
      ptr.lastMouseYLocal = 0;
      ptr.lastMouseXPage = 0;
      ptr.lastMouseYPage = 0;

      ptr.mouseButton = [false, false, false, false, false, false];

      ptr.mouseClick = false;
      ptr.mouseDblClick = false;
      ptr.mouseClickCount = 0;

      ptr.keyCtrl = false;
      ptr.keyShift = false;
      ptr.keyAlt = false;
      ptr.keyMeta = false;

      ptr.ownerEl = null;
      ptr.targetEl = null;
      ptr.lastTargetEl = null;

      ptr.key = 0;
      ptr.keyDown = false;
      ptr.keyPressed = false;

      ptr.lastEventType = null;

      var setBasic = function (e) {
	ptr.keyCtrl = e.ctrlKey;
	ptr.keyShift = e.shiftKey;
	ptr.keyAlt = e.altKey;
	ptr.keyMeta = e.metaKey;
	ptr.ownerEl = e.currentTarget;
	ptr.lastEventType = e.type;
      };

      var setMouseBasic = function (e) {
	setBasic (e);

	ptr.lastMouseXLocal  = ptr.mouseXLocal ;
	ptr.lastMouseYLocal  = ptr.mouseYLocal ;
	ptr.lastMouseXScreen = ptr.mouseXScreen;
	ptr.lastMouseYScreen = ptr.mouseYScreen;
	ptr.lastMouseXPage   = ptr.mouseXPage	;
	ptr.lastMouseYPage   = ptr.mouseYPage	;

	ptr.mouseXLocal = e.clientX;
	ptr.mouseYLocal = e.clientY;
	ptr.mouseXScreen = e.screenX;
	ptr.mouseYScreen = e.screenY;
	ptr.mouseXPage = e.pageX;
	ptr.mouseYPage = e.pageY;
	if (e.relatedTarget !== ptr.targetEl) {
	  ptr.lastTargetEl = ptr.targetEl;
	  ptr.targetEl = e.relatedTarget;
	}
      };

      var setBtn = function (e, bState, click) {
	setMouseBasic (e);
	ptr.mouseButton [e.button] = bState;
	if (click && ('detail' in e)
		  && typeof (e.detail) === 'number') {
	  ptr.mouseClickCount = e.detail;
	  switch (ptr.mouseClickCount) {
	    case 0:
	    ptr.resetClicks ();
	    break;
	    case 1:
	    ptr.mouseClick = true;
	    ptr.mouseDblClick = false;
	    break;
	    case 2:
	    ptr.mouseClick = false;
	    ptr.mouseDblClick = true;
	    break;
	  };
	} else
	  ptr.resetClicks ();

	ptr.sendEvent ('mouseButton', e);
      };

      this.onClick = function (evFeeder, msg) {
	setBtn (msg.event, false, true);
      };

      this.onDblClick = this.onClick;

      this.onMouseDown = function (evFeeder, msg) {
	setBtn (msg.event, true, false);
      };

      this.onMouseUp = function (evFeeder, msg) {
	setBtn (msg.event, false, false);
      };

      this.onMouseMove = function (evFeeder, msg) {
	setMouseBasic (msg.event);
	ptr.sendEvent ('mouseMove', msg.event);
      };

      this.onMouseOver = function (evFeeder, msg) {
	setMouseBasic (msg.event);
	ptr.sendEvent ('componentChange', msg.event);
      };

      this.onMouseOut = this.onMouseOver;

      var setKey = function (e, down, press) {
	setBasic (e);
	ptr.key = e.keyCode || e.which;
	ptr.keyDown = down;
	ptr.keyPressed = press;
	ptr.sendEvent ('key', e);
      };

      this.onKeyUp = function (evFeeder, msg) {
	setKey (msg.event, false, false);
      };

      this.onKeyDown = function (evFeeder, msg) {
	setKey (msg.event, true, false);
      };

      this.onKeyPress = function (evFeeder, msg) {
	setKey (msg.event, false, true);
      };

      this.init = function () {
	eventFeeder.addModeHandlers ('default', {
	  'click':	 this.onClick,
	  'dblclick': this.onDblClick,
	  'keydown':	 this.onKeyDown,
	  'keypress': this.onKeyPress,
	  'keyup':	 this.onKeyUp,
	  'mousedown':this.onMouseDown,
	  'mousemove':this.onMouseMove,
	  'mouseout': this.onMouseOut,
	  'mouseover':this.onMouseOver,
	  'mouseup':	 this.onMouseUp
	});

	eventFeeder.setMode ('default');
      };

      this.init ();
    },

    resetClicks: function () {
      this.mouseClick = false;
      this.mouseDblClick = false;
      this.mouseClickCount = 0;
    },

    getEventFeeder: function () {
      return this.eventFeeder;
    },

    getDeltaX: function () {
      return this.mouseXScreen - this.lastMouseXScreen;
    },

    getDeltaY: function () {
      return this.mouseYScreen - this.lastMouseYScreen;
    }
  });

  /// PimDataView

  $defClass ("PimDataView", {
    "extends": PimModeObservable,

    constructor: function (canvas, cfg) {
      PimModeObservable.call (this);
      this.canvas = null;
      this.dataModel = null;
      this.config = null;

      this.init = function () {
	var ptr = this;

	if ($defined (canvas))
	  this.canvas = canvas;
	if ($defined (cfg)) {
	  this.config = cfg;
	  if (!('get' in cfg)) {
	    cfg ['get'] = function (attr, mode) {
	      if (attr in ptr.config) {
		var atr = ptr.config [attr];
		if (mode in atr)
		  return atr [mode];
		return atr;
	      }
	      return null;
	    };
	  }
	} else
	  this.config = { get: function () { return null; } };
      };

      this.init ();
    },

    setDataModel: function (dm) {
      this.dataModel = dm;
    },

    setViewPortPostition: function (x, y) {
    },

    setViewPortScale: function (x, y) {
    },

    getDataModel: function (x, y) {
      return this.dataModel;
    },

    getConfig: function () {
      return this.config;
    },

    getCanvas: function () {
      return this.canvas;
    }
  });

  /// PimStateDataViz

  $defClass ("PimStateDataViz", {
    "extends": PimState,

    constructor: function (cfg) {
      PimState.call (this);
      var ptr = this;

      var onChangeState = function (state, msg) {
	var newData = state.getStateData (msg.newState);
	var oldData = state.getStateData (msg.oldState);

	if (oldData) {
	  $createSVGElement (oldData, {display: 'none'});
	}

	if (newData) {
	  $createSVGElement (newData, {display: 'inline'});
	}
      };

      this.init = function () {
	this.addHandler ('changeState', onChangeState);
	if ($defined (cfg))
	  this.config = cfg;
      };

      this.init ();
    }
  });

  /// PimCanvas

  $defClass ("PimCanvas", {
    constructor: function (rootEl, x, y, w, h) {
      this.paper = null;
      this.defs = null;
      this.globalGroup = null;
      this.x = x || 0;
      this.y = y || 0;
      this.width = w || 512;
      this.height = h || 512;
      this.eventFeeder = null;

      this.init = function () {
	// if rootEl is not defined create new ??
	if ($defined (rootEl) && $getElementById (rootEl)) {
	  if (!w)
	    this.width = f_clientWidth () - 4;
	  if (!h)
	    this.height = f_clientHeight () - 8;

	  this.paper = $SVGCanvas ($getElementById (rootEl),
				   this.x, this.y,
				   this.width, this.height);
	  this.defs = $createSVGElement ("defs");
	  $addNode (this.paper, this.defs);
	  this.globalGroup = $SVGgNode ();
	  $addNode (this.paper, this.globalGroup);
	  this.eventFeeder = new PimEventFeeder ($UUID ('feeder'));
	  this.eventFeeder.addElement (this.paper);

	  var tr = new PimTransform ({centerPos: [0,
						  0],
				      pos: [0,
					    0]});
	  tr.setTransform (this.globalGroup);
	} else {
	  $consoleLog ("no root element for canvas!!");
	}
      };

      this.init ();
    },

    defElement: function (el) {
      $addNode (this.defs, el);
    },

    addElement: function (el) {
      $addNode (this.globalGroup, el);
    },

    getEventFeeder: function () {
      return this.eventFeeder;
    },

    getTransform: function () {
      return new PimTransform ($getAttr (this.globalGroup, 'transform'));
    },

    setTransform: function (tr) {
      tr.setTransform (this.globalGroup);
    },

    toJSON: function () {
      return {
	transf: this.getTransform ().stringify ()
      };
    },

    fromJSON: function (jcanvas) {
      if (!jcanvas) return;
      this.setTransform (new PimTransform(jcanvas.transf));
    }
  });

  /// PimTransform
  $defClass ("PimTransform", {
    constructor: function (args) {
      this.centerPos = [0,0];
      this.pos = [0,0];
      this.scale = [1,1];
      this.rotation = [0];
      this.mat = null;

      this.init = function () {
	if (!$definedNonNull (args)) return;
	if (typeof (args) === 'string')
	  this.parse (args);
	else if (typeof (args) === 'object')
	  this.set (args);
      };

      this.init ();
    },

    parse: function (str) {
      if (str.indexOf ("matrix") !== -1) {
	var m = $map (str.slice (7, -1).split (","), parseFloat);

	this.pos = [m [4], m [5]];
	this.scale = [m [0], m [3]];
      } else {
	var tr = arguments [0].match (/translate\s*\((.*)\)\s*rotate\s*\((.*)\)\s*scale\s*\((.*)\)\s*translate\s*\((.*)\)/);

	var fill = function (args, arr) {
	  var i;
	  var tmp = args.split (' ');
	  for (i = tmp.length; i--;)
	    arr [i] = parseFloat (tmp [i]);
	};

	fill (tr [1], this.pos);
	fill (tr [2], this.rotation);
	fill (tr [3], this.scale);
	fill (tr [4], this.centerPos);
	this.centerPos [0] = -this.centerPos [0];
	this.centerPos [1] = -this.centerPos [1];
      }
    },

    set: function (tr) {
      for (var i in tr) {
	this [i] = tr [i];
      }
    },

    stringify: function () {
      var s = '';
      s = s + 'translate (' + this.pos [0] + ' ' + this.pos [1] + ')';
      s = s + ' rotate (' + this.rotation [0] + ')';
      s = s + ' scale (' + this.scale [0] + ' ' + this.scale [1] + ')';
      s = s + ' translate (' + (-this.centerPos [0]) + ' '
	+ (-this.centerPos [1]) + ')';
      return s;
    },

    getCenterPos: function () {
      return this.centerPos;
    },

    getPos: function () {
      return this.pos;
    },

    getScale: function () {
      return this.scale;
    },

    getRotation: function () {
      return this.rotation;
    },

    importMatrix: function (el) {
      this.mat = $getAttr (el, "transform");
    },

    getMatrix: function () {
      return this.mat;
    },

    setMatrix: function (m) {
      this.mat = m;
    },

    setTransform: function (el) {
      if (this.mat)
	$createSVGElement (el, {transform: this.mat});
      else
	$createSVGElement (el, {transform: this.stringify ()});
    }
  });

  /// PiMind
  $defClass ("PiMind", {
    "extends": PimModeObservable,

    constructor:function (dataView) {
      PimModeObservable.call (this);
      this.dataView = null;
      this.whiles = {};
      this.associations = {};

      this.init = function () {
	if ($definedNonNull (dataView))
	  this.dataView = dataView;
      };

      this.init ();
    },

    getWhileArchive: function () {
      return this.whiles;
    },

    addWhileToArchive: function (wid, w) {
      this.whiles [wid] = w;
    },

    removeWhileFromArchive: function (wid) {
      delete this.whiles [wid];
    },

    getWhileFromArchive: function (wid) {
      if (wid in this.whiles)
	return this.whiles [wid];
      return null;
    },

    getAssociationArchive: function () {
      return this.associations;
    },

    addAssociationToArchive: function (aid, a) {
      this.associations [aid] = a;
    },

    removeAssociationFromArchive: function (aid) {
      delete this.associations [aid];
    },

    getAssociationFromArchive: function (aid) {
      if (aid in this.associations)
	return this.associations [aid];
      return null;
    },

    addWhile: function (desc) {
      this.sendEvent ('addWhile', desc);
      return this.getReturnContainer ();
    },

    removeWhile: function (wid) {
      this.sendEvent ('removeWhile', {wid: wid});
      return this.getReturnContainer ();
    },

    associateWhiles: function (wid1, wid2, desc, wid3) {
      this.sendEvent ('associateWhiles',
		      {wid1: wid1, wid2: wid2, desc: desc, wid3: wid3});
      return this.getReturnContainer ();
    },

    removeAssociation: function (aid) {
      this.sendEvent ('removeAssociation', {aid: aid});
      return this.getReturnContainer ();
    },

    updateWhile: function (wid, desc) {
      this.sendEvent ('updateWhile', {wid:wid, desc: desc});
    },

    updateAssociation: function (aid, desc) {
      this.sendEvent ('updateAssociation', {aid:aid, desc: desc});
    },

    getAssociatedWhiles: function (wid) {
      this.sendEvent ('getAssociatedWhiles', wid);
      return this.getReturnContainer ();
    },

    getWhileAssocitions: function (wid) {
      this.sendEvent ('getWhileAssocitions', wid);
      return this.getReturnContainer ();
    },

    getAssociationWhiles: function (aid) {
      this.sendEvent ('getAssociationWhiles', aid);
      return this.getReturnContainer ();
    },

    getDataView: function () {
      return this.dataView;
    },

    toJSON: function (selection) {
      this.sendEvent ('toJSON', selection);
      return this.getReturnContainer ();
    },

    fromJSON: function (json, wbase, abase, inplace) {
      this.sendEvent ('fromJSON',
		      { json: json, wbase: wbase, abase: abase, inplace: inplace});
    },

    clearMind: function () {
      this.sendEvent ('clearMind');
      return this.getReturnContainer ();
    },

    filterMind: function (fnBuoy, fnEdge, bSelection, eSelection) {
      this.sendEvent ('filterMind', {fnBuoy: fnBuoy,
				     fnEdge: fnEdge,
				     bSelection: bSelection,
				     eSelection: eSelection});
      return this.getReturnContainer ();
    },

    getBuoysByAttrs: function (attrs) {
      this.sendEvent ('getBuoysByAttrs', {attrs: attrs});
      return this.getReturnContainer ();
    }
  });

  /// PimMindOperator

  $defClass ("PimMindOperator", {
    "extends": PimModeObservable,

    constructor:function (mind) {
      PimModeObservable.call (this);

      this.mind = null;
      this.evFeederState = null;

      this.init = function () {
	if ($definedNonNull (mind)) {
	  this.mind = mind;

	  var canvasEventFeeder = mind.getDataView ().getCanvas ().getEventFeeder ();

	  this.evFeederState = new PimEventFeederState (canvasEventFeeder);
	}
      };

      this.init ();
    },

    getEvFeederState: function () {
      return this.evFeederState;
    }
  });

  /// PimBB
  $defClass ("PimBB", {
    constructor: function (points) {
      this.bb = [Number.MAX_VALUE,Number.MAX_VALUE,
                 -Number.MAX_VALUE,-Number.MAX_VALUE];

      this.init = function () {
	if ($definedNonNull (points))
	  for (var i = points.length; i--;)
	    this.update (points [i]);
      };

      this.init ();
    },

    update: function (p) {
      if (p [0] < this.bb [0])
	this.bb [0] = p [0];
      if (p [0] > this.bb [2])
	this.bb [2] = p [0];
      if (p [1] < this.bb [1])
	this.bb [1] = p [1];
      if (p [1] > this.bb [3])
	this.bb [3] = p [1];
    },

    inside: function (p, tolerance) {
      if (p [0] < (this.bb [0] + tolerance))
	return false;
      if (p [0] > (this.bb [2] - tolerance))
	return false;
      if (p [1] < (this.bb [1] + tolerance))
	return false;
      if (p [1] > (this.bb [3] - tolerance))
	return false;
      return true;
    }
  });

  /// PimRenderBox
  $defClass ("PimRenderBox", {
    constructor: function (cfg, prefix, nofLevels, dataView) {
      this.dataView = dataView;
      this.nofLevels = nofLevels;
      this.renderObject = null;	     // global group of all svg objects
      this.renderContent = null;	     // group of components
      this.renderCom = null;	     // topmost object for communication
      this.renderBorder = null;	     // border object
      this.renderLevels = null;
      this.dataUpdated = null;
      this.cfg = cfg || null;

      this.init = function () {
	if (!$definedNonNull (dataView)) return;

	var i, tr;
	this.renderLevels = new Array (nofLevels);
	this.dataUpdated = new Array (nofLevels);
	for (i = nofLevels; i--;) this.dataUpdated [i] = false;

	// make border
	var w = cfg.get (prefix + '-width', 'init') || 100;
	var h = cfg.get (prefix + '-height', 'init') || 100;
	var col = cfg.get (prefix + '-border-color', 'init') || '#009cff';
	var bw = cfg.get (prefix + '-border-width', 'init') || '2';
	var br = cfg.get (prefix + '-border-radius', 'init') || '2';
	var bg = cfg.get (prefix + '-background-color', 'init') || 'white';
	var border = $SVGRect (0, 0, w, h);
	this.renderBorder = border;
	$createSVGElement (border, {
	  rx : br,
	  ry : br,
	  stroke : col,
	  'stroke-width': bw,
	  fill: bg
	});

	// content group
	var px = (cfg.get (prefix + '-padding-x', 'init') || 1) + parseInt (bw);
	var py = (cfg.get (prefix + '-padding-y', 'init') || 1) + parseInt (bw);
	var cont = new Array (nofLevels);
	for (i = nofLevels; i--;) {
	  var div = $createHTMLElement ("div");
	  // div.style.display = "none";
	  this.renderLevels [i] = $SVGForeignObj (div, px, py,
						  (w > 2 * px) ?	 w - 2 * px : 1,
						  /*(h > 2 * py) ? h - 2 * py : 1*/ 2048);
	  tr = new PimTransform ({});
	  tr.setTransform (this.renderLevels [i]);
	  $createSVGElement (this.renderLevels [i], {display: 'none'});
	}

	this.renderContent = $SVGgNode (this.renderLevels);
	var cp = $SVGClip (px, py,
		           (w > 2 * px) ? w - 2 * px : 1,
		           (h > 2 * py) ? h - 2 * py : 1,
		           br, br, bw);
	this.dataView.getCanvas ().defElement (cp);
	$createSVGElement (this.renderContent, {"clip-path" : $SVGRef ($getAttr (cp, 'id'))});

	this.renderCom = $SVGRect (0, 0, w, h);
	$createSVGElement (this.renderCom, {'opacity' : 0});

	this.renderObject = $SVGgNode ([border, this.renderContent, this.renderCom]);
	var cpFn = cfg.get ('centerPosFn')
		|| function (w, h) { return [w/2, h/2]; };
	tr = new PimTransform ({pos: [0, 0], centerPos: cpFn (w, h)});
	$createSVGElement (this.renderObject,
			   {transform: tr.stringify (),
			    id: $UUID ('rb')});
	this.dataView.getCanvas ().addElement (this.renderObject);
      };

      this.init ();
    },

    getEventFeeder: function (obj) {
      var eventFeeder = new PimEventFeeder ($UUID ('feeder'));
      eventFeeder.addElement (this.renderObject, obj);
      return eventFeeder;
    },

    getAbsolutePos: function () {
      return getElementAbsolutePos (this.renderBorder);
    },

    resetDataUpdated: function (level) {
      this.dataUpdated [level] = false;
    },

    updateData: function (level, data) {
      if (!$definedNonNull (data)) return;
      var div = this.renderLevels [level].firstChild;

      if (this.dataUpdated [level] === false) {
	if (typeof (data) === 'string')
	  div.innerHTML = data;
	else
	  $addNode (div, data);

	this.dataUpdated [level] = true;
        updateMath (div);
      }
    },

    setRenderDataAsSData: function (obj) {
      for (var i = this.nofLevels; i--;) {
	obj.insertState (i, {data: this.renderLevels [i]});
      }
    },

    showRenderData: function (level) {
      $createSVGElement (this.renderLevels [level], {display: 'inline'});
    },

    hideRenderData: function (level) {
      $createSVGElement (this.renderLevels [level], {display: 'none'});
    },

    setPos: function (pos) {
      var tr = new PimTransform ($getAttr (this.renderObject, 'transform'));
      if ('x' in pos)
	tr.set ({pos: [pos.x, pos.y]});
      else
	tr.set ({pos: [pos [0], pos [1]]});
      $createSVGElement (this.renderObject, {transform: tr.stringify ()});
    },

    getPos: function () {
      var tr = new PimTransform ($getAttr (this.renderObject, 'transform'));
      return tr.getPos ();
    },

    getCenterPos: function () {
      var tr = new PimTransform ($getAttr (this.renderObject, 'transform'));
      return tr.getCenterPos ();
    },

    getSize: function () {
      var w = parseInt ($getAttr (this.renderBorder, 'width'));
      var h = parseInt ($getAttr (this.renderBorder, 'height'));
      return [w, h];
    },

    getLevelRenderData: function (level) {
      return this.renderLevels [level];
    },

    getBB: function () {
      var pos = this.getPos ();
      var cpos = this.getCenterPos ();
      var size = this.getSize ();

      pos [0] -= cpos [0]; pos [1] -= cpos [1];

      return new PimBB ([[pos [0], pos [1]],
			 [pos [0] + size [0], pos [1] + size [1]]]);
    },

    resize: function (w, h) {
      var px, py;

      var x = parseInt ($getAttr (this.renderBorder, 'x'));
      var y = parseInt ($getAttr (this.renderBorder, 'y'));
      var ow = parseInt ($getAttr (this.renderBorder, 'width'));
      var oh = parseInt ($getAttr (this.renderBorder, 'height'));

      $createSVGElement (this.renderBorder, {width: w, height: h});
      $each (this.renderContent.childNodes, function (el) {
	px = parseInt ($getAttr (el, 'x')) - x; py = parseInt ($getAttr (el, 'y')) - y;
	$createSVGElement (el, { width: (w > 2 * px) ? w - 2 * px : 1,
			         height: /*(h > 2 * py) ? h - 2 * py : 1*/ 2048});
      });
      var cp = $getElementById ($SVGUnref ($getAttr (this.renderContent,
						     'clip-path')));
      $createSVGElement (cp.firstChild,
			 {width: (w > 2 * px) ? w - 2 * px : 1,
			  height: (h > 2 * py) ? h - 2 * py : 1});
      $createSVGElement (this.renderCom, {width: w, height: h});

      var tr = new PimTransform ($getAttr (this.renderObject, 'transform'));
      var cpos = tr.getCenterPos ();
      var pos = tr.getPos ();
      var cpFn = this.cfg.get ('centerPosFn')
	      || function (w, h) { return [w/2, h/2]; };
      tr.set ({pos: [pos [0], pos [1]], centerPos: cpFn (w, h)});
      $createSVGElement (this.renderObject, {transform: tr.stringify ()});

      //this.setPos ([x + ow/2,y + oh/2]);
    },

    getScrollContentObject: function (level) {
      var tr = new PimTransform ($getAttr (this.renderLevels [level],
					   'transform'));
      return tr.getPos ();
    },

    scrollContentObject: function (level, x, y) {
      var tr = new PimTransform ($getAttr (this.renderLevels [level],
					   'transform'));
      // var pos = tr.getPos ();
      tr.set ({pos: [/*pos [0] +*/ x, /*pos [1] + */ y]});
      tr.setTransform (this.renderLevels [level]);
    },

    hideComObject: function () {
      $createSVGElement (this.renderCom, {display: 'none'});
    },

    showComObject: function () {
      $createSVGElement (this.renderCom, {display: 'inline'});
    },

    moveOnTop: function () {
      $asLast (this.renderObject);
    },

    moveToBottom: function () {
      $asFirst (this.renderObject);
    },

    mark: function () {
      $createSVGElement (this.renderCom, {'opacity' : 0.3, fill: 'red'});
    },

    unmark: function () {
      $createSVGElement (this.renderCom, {'opacity' : 0});
    },

    isComObjHidden: function () {
      return $getAttr (this.renderCom, 'display') === 'none';
    },

    setBorderColor: function (col) {
      $createSVGElement (this.renderBorder, {stroke : col});
    },

    setBgColor: function (col) {
      $createSVGElement (this.renderBorder, {fill : col});
    },

    setBorderWidth: function (w) {
      $createSVGElement (this.renderBorder, {'stroke-width' : w});
    },

    setBorderCorner: function (rx, ry) {
      $createSVGElement (this.renderBorder, {rx : rx, ry: ry});
      var cp = $getElementById ($SVGUnref ($getAttr (this.renderContent,
						     'clip-path')));
      $createSVGElement (cp.firstChild, {rx : rx, ry: ry});
    },

    setBorderDash: function (dash) {
      $createSVGElement (this.renderBorder, {'stroke-dasharray': dash});
    },

    hide: function () {
      $createSVGElement (this.renderObject, {display: 'none'});
    },

    isHidden: function () {
      return $getAttr (this.renderObject, "display") === "none";
    },

    show: function () {
      $createSVGElement (this.renderObject, {display: 'inline'});
    },

    destroy: function () {
      $removeNode (this.renderObject);
    }
  });

  // PimCodeSnippet
  $defClass ("PimCodeSnippet", {
    "extends": PimState,

    constructor: function (nofLevels) {
      PimState.call (this);

      this.nofLevels = nofLevels;

      this.init = function () {
	for (var i = nofLevels; i--;)
	  this.insertState (i, {data: null});
      };

      this.init ();
    },

    containsScript: function (str) {
      if (str)
	return str.search (/<script.*>[\s\S]*?<\/script>/) !== -1;
      return false;
    },

    parse: function (str, level) {
      var m = str.match (/<script(.*)>([\s\S]*?)<\/script>/);
      var attrs = m [1].trim ().split (" ");

      for (var i = attrs.length; i--; ) {
	var pair = attrs [i].split ("=");
	if (pair.length === 2)
	  this.setStateAttr (level, pair [0].trim (),
			     pair [1].trim ());
      }

      this.setStateAttr (level, "run-count", 0);
      this.setStateAttr (level, "last-run", 0);
      this.setStateData (level, m [2]);
    },

    run: function (level, args) {
      var code = this.getStateData (level);
      var runCount = this.getStateAttr (level, "run-count");
      var maxRuns = this.getStateAttr (level, "max-runs");

      if (maxRuns
	&& runCount >= parseInt (maxRuns))
	return false;

      var delay = this.getStateAttr (level, "run-delay");
      var lastRun = this.getStateAttr (level, "last-run");

      if (delay
	&& (delay > ($time () - lastRun)))
	return false;

      window.PimSnippetArgs = args;

      try {
	eval (code);
      } catch (x) {
	$consoleLog (x);
      }

      this.setStateAttr (level, "run-count", runCount + 1);
      this.setStateAttr (level, "last-run", $time ());

      return true;
    }
  });

  /// PimBuoy
  $defClass ("PimBuoy", {
    "extends": PimStateDataViz,

    constructor:function (pos, nofLevels, dataView, did) {
      PimStateDataViz.call (this);
      var ptr = this;

      this.dataView = null;
      this.did = -1;
      this.nofLevels = -1;
      this.sids = null;
      this.eventFeeder = null;
      this.iframeData = null;
      this.rbox = null;
      this.shadowBuoy = null;

      this.codeSnippet = null;
      this.frozenMode = -1;

      var testNakedIFrame = function (data) {
	if (!$definedNonNull (data)) return false;

	if (ptr.rbox.isComObjHidden ()) {
	  if (typeof (data) === 'string') {
	    if (data.indexOf ('iframe') !== -1)
	      return true;
	  } else {
	    if (data.getElementsByTagName("iframe"))
	      return true;
	  }
	}

	return false;
      };

      var showIFrame = function (data, level) {
	var div;
	var cfg = ptr.dataView.getConfig ();

	if (!$definedNonNull (ptr.iframeData [level])) {
	  div = $createHTMLElement ("div");
	  if (typeof (data) === 'string')
	    div.innerHTML = data;
	  else
	    $addNode (div, data);
	  div.style.zIndex = "1";
	  div.style.position = "absolute";
	  var bc = ptr.getStateAttr (level, 'levelBorderColor');
	  var b = bc ? "2px solid " + bc
		: cfg.get ('buoy-border', 'iframe') ||
	    "2px solid #009cff";
	  div.style.border = b;
	  $addNode (document.body, div);
	  ptr.iframeData [level] = div;

	  var sendOut = function (ev) {
	    var ef = ptr.getEventFeeder ();
	    ef.onMouseOut (ev);
	  };

	  $addEventHandler (div, 'mouseout', sendOut);
	} else
	  div = ptr.iframeData [level];

	/// @todo: get exact absolute position
	var gpos = ptr.rbox.getAbsolutePos ();
	var size = ptr.rbox.getSize ();

	var iframe = div.getElementsByTagName("iframe") [0];

	var b = cfg.get ('buoy-border-width', 'init') || '2';

	iframe.style.width = size [0] + 2 * b + "px";
	iframe.style.height = size [1] + 2 * b + "px";

	div.style.left = gpos.x - b + "px";
	div.style.top = gpos.y - b + "px";
	div.style.display = "inline";
      };

      var hideIFrame = function (level) {
	if (ptr.iframeData [level]) ptr.iframeData [level].style.display = "none";
      };

      var onChangeState = function (state, msg) {
	if (msg.newState === null) return;

	var dv = ptr.dataView;
	var newData = ptr.rbox.getLevelRenderData (msg.newState);
	var oldData = ptr.rbox.getLevelRenderData (msg.oldState);

	if (oldData) {
	  var data = dv.getDataModel ().getSData (ptr.did, msg.oldState);
	  if (testNakedIFrame (data)) {
	    hideIFrame (msg.oldState);
	  }
	}

	if (newData) {
	  var data = dv.getDataModel ().getSData (ptr.did, msg.newState);

	  if (ptr.codeSnippet.containsScript (data))
	    ptr.codeSnippet.run (msg.newState, {buoy: ptr, data: msg.data});

	  if (testNakedIFrame (data)) {
	    showIFrame (data, msg.newState);
	  } else {
	    ptr.rbox.updateData (msg.newState, data);
	  }
	}
      };

      this.init = function () {
	if ($definedNonNull (dataView)) {
	  this.dataView = dataView;
	  this.sids = new Array (nofLevels);
	  if ($definedNonNull (did))
	    this.did = did;
	  else
	    this.did = dataView.getDataModel ().addData ();
	  this.nofLevels = nofLevels;
	  this.iframeData = $newArray (nofLevels);
	  this.codeSnippet = new PimCodeSnippet (nofLevels);

	  var cfg = dataView.getConfig ();
	  this.rbox = new PimRenderBox (cfg, "buoy", nofLevels, dataView);
	  this.rbox.setRenderDataAsSData (this);
	  this.rbox.setPos ([pos.x, pos.y]);

	  this.eventFeeder = this.rbox.getEventFeeder (this);
	  this.addHandler ('changeState', onChangeState);
	  this.initAttrs (cfg);
	}
      };


      this.initAttrs = function (cfg) {
	for (var i = PimBuoy.prototype.levelAttrs.length; i--;) {
	  var attr = PimBuoy.prototype.levelAttrs [i];
	  this.setStateAttrs (attr ["name"],
			      cfg.get ('buoy-' + attr ["name"], 'init') ||
                              $genArray (this.nofLevels, attr ["init"]));
	}

	this.addHandler ('updateStateAttr',
		         function (self, msg) {
		           $pickf (msg.attr, ptr, {
			     'levelSize': function (msg) {
			       this.resize (msg.value [0], msg.value [1]);
			     },
			     'levelBorderColor': function (msg) {
			       this.setBorderColor (msg.value);
			     },
			     'levelBgColor' : function (msg) {
			       this.rbox.setBgColor (msg.value);
			     },
			     'levelBorderWidth' : function (msg) {
			       this.rbox.setBorderWidth (msg.value);
			     },
			     'levelBorderCorner' : function (msg) {
			       this.rbox.setBorderCorner (msg.value [0], msg.value [1]);
			     },
			     'levelContentScroll': function (msg) {
			       this.rbox.scrollContentObject (msg.stateId, msg.value [0], msg.value [1]);
			     },
			     'levelBorderDash': function (msg) {
			       this.rbox.setBorderDash (msg.value);
			     }
		           },
		           msg
		          );
		         }
	                );
      };

      this.init ();
    },

    levelAttrs: [
      /*
       * Description of the fields.
       *
       * 0 - name of attribute
       * 1 - names of input field in a input form
       * 2 - names of input field labels
       * 3 - init function
       * 4 - size of input field
       * 5 - position in form
       */
      // 0 - levelSize
      {
	name: 'levelSize', fname: ['widthl', 'heightl'],
	lname: ['Width', 'Height'],
	init :function (i) {
	  switch (i) {
	    case 0:
	    return [250, 60];
	    case 1:
	    return [320, 150];
	    case 2:
	    return [400, 400];
	  };
	  return null;
	}, isize: [3, 3], fpos: 1, type: "range", typeAttrs: {min: 10, max: 1000, step: 10},
	icon: "data:image/png;base64,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"
      },
      // 1 - levelBorderColor
      {
	name: 'levelBorderColor', fname: ['bcol'],
	lname: ['Border Color'],
	init: function () {
	  return '#009cff';
	}, isize: [6], fpos: 2, type: "color",
	icon: "data:image/png;base64,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\
rkJggg=="
      },
      // 2 - levelBgColor
      {
	name: 'levelBgColor', fname: ['bgcol'],
	lname: ['Background Color'],
	init: function () {
	  return '#ffffff';
	}, isize: [6], fpos: 3, type: "color",
	icon: "data:image/png;base64,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"
      },
      // 3 - levelBorderWidth
      {
	name: 'levelBorderWidth', fname: ['bwidth'],
	lname: ['Border Width'],
	init: function () {
	  return 2;
	}, isize: [2], fpos: 4, type: "range", typeAttrs: {min: 0, max: 10, step: 1},
	icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A\
/wD/oL2nkwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB90EFRYXBOp2O3EAAAScSURBVFjD\
zZddaBRXFMd/Z2Y249amWgoVGz9R0dhYSKoFH7RV+gEVW0SkiSFRC82DbhIV+lKKfVDblxbdxJai\
NB+bxFgfhLbQPvRFEsQPaBGah4hilJBqrJS0ic1mZ+eePuxOmjS7m2RpwQMXdmb23v/5+N//uRce\
B3vto4685278oC2veS+83wqABC/2fnpe7gzFCz3fFEx4ncuSlz5hCPaw5Ui7OxxPzndt8aebJIKK\
MNx9fE8CwAk+3BmKF97+Uw97ho1Acrp1gFvh9zg4egZTURxOHr08ctjztUxExsgdgQocBy5PcsDz\
TYFn2Jjw5fWZJVF75oZERoGaip1+UW2s2cAO39dVufDTX5qCZ2vyJ0kGaQIl95gwd3MDA43VveEC\
52XHlp9AEWHKSEGgqfVT5mSMTVXCoXlf2pbTle0/wO8jI4OpmnfVAfCkn4jHjYRnyKHsDgDYltN1\
9+T2zpkutDzSsuBhUi4mVdeIqKZjntasfJwDKKlrGf9dFGlb+cjIjylwmTH4dA5ktdX1Z+lp2AvA\
4kisxDOm01fWpWsrs1krLwduRHcDsCjSunbMaJOB9SliZo1c9b9yYHXdWQBWRJqXJAztBt2gqqRS\
nxU8RYsMblizBb/RsJtlB2LPjPjygw+lqhKAS+YNpSKqfXNdt9i2pAdVCfbxvxzQtEhpxpoD4+Cj\
ai4lkbWCajrpkgEYVRURuRmeM7fs7smKXtexdliW/ALYUxywRDxBei2Rny3husDDgO1BzVdEmpeM\
GtOVVFmdIpxkj1oEEbnuWPJK/4ldQ+xtpT9adSscsva4jnVjsjK+/QV8s3/qUuXfw7k3xwmXMLT7\
UCpobnAEhCuO7VTfb6y8CbDpww66bz6Cr2sAKKxpYvj0u6kMvFE6L3PR0+CLI7GShKHFoKWpCmVm\
exA5wjVbrH0B+LqDX9F9rHIcHGBR2Eyu3ZYj7W5FcThZU7HTZ3PDuLwWRdpWesZ0Glg/ge25Ut9j\
W/LW4KnqPoCi+k4GohWUHjrz6pivT4lgRLjac7Lm3iQODMeT849eHvm4qDa2JgBfHmlZ4BlzwdcZ\
g992Q+7WAHxhbYyBaAUAg17oswdewbkHXkHHYKJgwxQSurb4nq9lntFvlx7qWPh8XfPTfxm56Kuu\
E1GVVNZzsf22a1E2EC3/raj+HAD3GqsnNuI5ioQUCYPYGfVeRMZ8X1fFveR3cSPhf7Q9Z9QAPW7I\
3ToQLf9jYSTGQLQ8724oICR9fREkLV/kZjtcsy0pDyKfDXjWjifjJJ+G7XDFFmvf4KmqPmDW4Pk2\
o0Aqrzu2Uz34eVVvQLh8zJkteCCvjiXb7jdW/jpxq/3fDgTy1xd2n3ip/8SuIYCi2ta8wWflQNBS\
C+e42/rS2r5pkUP3sUqei7RuBz0O4ma9RBiWzdgBzVH8R4nE+cX1bTv6o1W3ut85DcCYzzyQ4mkD\
SjViyUjC9HFK06dnzThE1BgtGUuaC0sPtpUG2p6WVy9968k+dPxmNPVYLsJw+sbSJNmTkCqEYvsG\
b0JgXUD5xD6fIwkqwtWMF8XZWmFNE8/uz2/uggOtPBb2N6siJj99MW0rAAAAAElFTkSuQmCC"
      },
      // 4 - levelBorderCorner
      {
	name: 'levelBorderCorner', fname: ['bcornerx', 'bcornery'],
	lname: ['Corner x', 'Corner y'],
	init: function () {
	  return [5,5];
	}, isize: [2,2], fpos: 5, type: "range", typeAttrs: {min: 0, max: 100, step: 1},
	icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A\
/wD/oL2nkwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB90EFRYaLR1q3VAAAAEVSURBVFjD\
7ZaxSgNBEIY/jyCCQiw2tYWdL2DhAwSEaCVoIdNfZ21rbTn9FUKKGLAS8hD6CoKdTCchaKE2I6TZ\
8/aSIIH9m51jl7lvZxbmh6ysdVAoq5Xl3mjw833gHDgAvhrmLYAX4N5UnkJZYSrpAKGsboBr//wA\
3hsCbAE7Hg9N5SK5AqGs9vwWz8CRqcwS27YJjIAB0DeVSaxUMZ35egrMWrT301ROPB7EDnVqEmwD\
mMprm8c11/M3YLfusaxaRetN/psuA2SADJABlqTvtgBTn2phQUPS+82VCvDg6yhmJhqM5DsPx7FL\
/GVIboGrualWJJS95/GjqRwvYskOgUugm1iAKTA2lUmdJVtbM5uVtTT9AIBeRUAUKhUOAAAAAElF\
TkSuQmCC"
      },
      // 5 - levelContentScroll
      {
	name: 'levelContentScroll', fname: [],
	lname: [],
	init: function () {
	  return [0,0];
	}, isize: [], fpos: 6
      },
      // 6 - levelBorderDash
      {
	name: 'levelBorderDash', fname: ['bdash'],
	lname: ['Border dash'],
	init: function () {
	  return "1,0";
	}, isize: [6], fpos: 7, type: "text",
	icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A\
/wD/oL2nkwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB90EFRcpGyd5R84AAAD6SURBVFjD\
7dKxSgMxHMfxb2LicQ9gJ9eic3EVB8V3EMWhiiD0HcRnUBBEO4iCz6A4HAUncW7B0el8gCNNSBy6\
eFe6dDmH/2dN/smP/AJCCCFEy9Syg52T624y2R6A8u61HA6+lg6wdnqzDZwB08a6yapy+P10UdQu\
7191k82fozY9BajoP1RwB+V9PcT64eWOyzt9IDTOXQVuf+7ORwYg2XwDOGqmS0Dy2TtQ1GPZ/ahN\
D6Vme1bslonTXaAWIJlsM9r8eMEzF8BIt/0HzKzDagI8NitQYFRw47mp4F+0Mp9/K0gxvc31G9xY\
++phQQWTf/EJhRBCiNb9AkCqVdr3PKmTAAAAAElFTkSuQmCC"
      },
      // 7 - levelName
      {
	name: 'levelName', fname: ['lname'],
	lname: ['Name'],
	init: function () {
	  return "";
	}, isize: [6], fpos: 0, type: "text"
      }
    ],

    setLevelData: function (level, data) {
      this.rbox.resetDataUpdated (level);

      if ($definedNonNull (this.iframeData [level]))
	$removeNode (this.iframeData [level]);
      this.iframeData [level] = null;

      if (this.codeSnippet.containsScript (data))
	this.codeSnippet.parse (data, level);

      this.dataView.getDataModel ().setSData (this.did, level, data);
    },

    updateLevelData: function (level) {
      var data = this.dataView.getDataModel ().getSData (this.did, level);

      if (this.codeSnippet.containsScript (data))
	this.codeSnippet.parse (data, level);
    },

    getLevelData: function (level) {
      return this.dataView.getDataModel ().getSData (this.did, level);
    },

    getDatas: function () {
      return this.dataView.getDataModel ().getDatas (this.did, $range (0, this.nofLevels));
    },

    getEventFeeder: function () {
      return this.eventFeeder;
    },

    setPos: function (pos) {
      this.rbox.setPos (pos);
      this.sendEvent ('setPos', pos);
    },

    getPos: function () {
      return this.rbox.getPos ();
    },

    getCenterPos: function () {
      return this.rbox.getCenterPos ();
    },

    getSize: function () {
      return this.rbox.getSize ();
    },

    getBB: function () {
      return this.rbox.getBB ();
    },

    // @todo: sync it with init
    resize: function (w, h) {
      this.rbox.resize (w, h);
    },

    hideComObject: function () {
      this.rbox.hideComObject ();
    },

    showComObject: function () {
      this.rbox.showComObject ();
    },

    getDID: function () {
      return this.did;
    },

    moveOnTop: function () {
      this.rbox.moveOnTop ();
    },

    moveToBottom: function () {
      this.rbox.moveToBottom ();
    },

    setBorderColor: function (col) {
      this.rbox.setBorderColor (col);
    },

    scrollContent: function (dx, dy) {
      // this.rbox.scrollContentObject (this.getCurrentState (), dx, dy);
      var pos = this.rbox.getScrollContentObject (this.getCurrentState ());
      this.updateStateAttr (this.getCurrentState (),
			    'levelContentScroll',
			    [pos [0] + dx, pos [1] + dy]);
    },

    toJSON: function () {
      var j = {};
      var pos = this.getPos ();

      j.pos = {x: pos [0], y: pos [1]};
      j.wid = this.did;
      j.nofLevels = this.nofLevels;
      j.initState = this.getCurrentState ();
      j.state = PimStateDataViz.prototype.toJSON.call (this);
      j.state.data = {};

      return j;
    },

    fromJSON: function (json) {
      PimStateDataViz.prototype.fromJSON.call (this, json.state);
    },

    mark: function () {
      this.rbox.mark ();
    },

    unmark: function () {
      this.rbox.unmark ();
    },

    hide: function () {
      this.rbox.hide ();
    },

    isHidden: function () {
      return this.rbox.isHidden ();
    },

    show: function () {
      this.rbox.show ();
    },

    setShadowBuoy: function (b) {
      this.shadowBuoy = b;
    },

    destroy: function () {
      this.rbox.destroy ();
      this.dataView.getDataModel ().removeData (this.did);
    }
  });

  /// PimBuoyAssociation

  $defClass ("PimBuoyAssociation", {
    "extends": PimStateDataViz,

    constructor: function (sb, eb, nofLevels, dataView, aid, ab,
			   curved, arrowed) {
      PimStateDataViz.call (this);
      var ptr = this;

      this.aid = -1;
      this.nofLevels = -1;
      this.renderObject = null;
      this.startBuoy = null;
      this.endBuoy = null;
      this.assocBuoy = null;
      this.dataView = dataView;
      this.curved = true;
      this.arrowed = true;
      this.marker = null;

      this.weight = 1;
      this.color = '#009cff';

      this.eventFeeder = null;

      this.getPth = function () {
	var p1 = ptr.startBuoy.getPos (), p2 = ptr.endBuoy.getPos ();

	var p3 = [(p1 [0] + p2 [0]) / 2 + (p1 [1] - p2 [1]) * 0.1 * ptr.curved,
		  (p1 [1] + p2 [1]) / 2 + (p2 [0] - p1 [0]) * 0.1 * ptr.curved];

	if (ptr.curved)
	  return "M " + p1 [0] + "," + p1 [1] + "S" + p1 [0] + ","
	       + p1 [1] + " " + p3 [0] + "," + p3 [1]
	       + "S" + p2 [0] + "," + p2 [1] + " "
	       + p2 [0] + "," + p2 [1];
	else
	  return "M " + p1 [0] + "," + p1 [1]
	       + "L " + p3 [0] + "," + p3 [1]
	       + "L " + p2 [0] + "," + p2 [1];
      };

      var onPosSet = function (buoy, newPos) {
	$createSVGElement (ptr.renderObject, {d: ptr.getPth ()});
      };

      this.init = function () {
	if ($definedNonNull (dataView)) {
	  this.dataView = dataView;
	  this.nofLevels = nofLevels;
	  if ($definedNonNull (aid))
	    this.aid = aid;
	  else
	    this.aid = dataView.getDataModel ().linkData (sb.getDID (), eb.getDID ());

	  this.startBuoy = sb;
	  this.endBuoy = eb;
	  this.setAssocBuoy (ab);
	  if ($defined (curved))
	    this.cureved = curved;
	  if ($defined (arrowed))
	    this.arrowed = arrowed;

	  sb.addHandler ('setPos', onPosSet);
	  eb.addHandler ('setPos', onPosSet);

	  var cfg = dataView.getConfig ();
	  var col = cfg.get ('association-edge-color', 'init') || '#009cff';
	  var aw = cfg.get ('association-edge-width', 'init') || '2';

	  this.marker = $SVGMark (col);
	  this.dataView.getCanvas ().defElement (this.marker);

	  this.renderObject = $SVGPath (ptr.getPth ());
	  $createSVGElement (this.renderObject,
			     {stroke: col,
			      "stroke-width": aw, fill: "none" });
	  if (this.arrowed)
	    $createSVGElement (this.renderObject,
			       {"marker-mid": $SVGRef ($getAttr (this.marker, 'id')) });
	  this.dataView.getCanvas ().addElement (this.renderObject);
	  $asFirst (this.renderObject);

	  this.insertState (0, {data: null});

	  this.eventFeeder = new PimEventFeeder ($UUID ('feeder'));
	  this.eventFeeder.addElement (this.renderObject, this);
	}
      };

      this.init ();
    },

    setColor: function (color) {
      this.color = color;
      $createSVGElement (this.renderObject, {stroke: color});
      $createSVGElement (this.marker, {fill: color});
    },

    getColor: function () {
      return this.color;
    },

    setWeight: function (w) {
      this.weight = w;
      $createSVGElement (this.renderObject, {"stroke-width": w * 5});
    },

    getWeight: function () {
      return this.weight;
    },

    setLevelData: function (level, data) {
      this.dataView.getDataModel ().setLinkData (this.aid, level, data);
    },

    getAID: function () {
      return this.aid;
    },

    getEventFeeder: function () {
      return this.eventFeeder;
    },

    getAssocBuoy: function () {
      return this.assocBuoy;
    },

    setAssocBuoy: function (b) {
      this.sendEvent ('assocBuoyChanged', {'new': b, old: this.assocBuoy});

      if (this.assocBuoy)
	this.assocBuoy.show ();

      if (b)
	b.hide ();

      this.assocBuoy = b;
    },

    setCurved: function (curved) {
      if (this.curved !== curved) {
	this.curved = curved;
	$createSVGElement (this.renderObject, {d: this.getPth ()});
      }
    },

    setArrowed: function (arrowed) {
      if (this.arrowed !== arrowed) {
	this.arrowed = arrowed;
	if (arrowed)
	  $createSVGElement (this.renderObject,
			     {"marker-mid": $SVGRef ($getAttr (this.marker, 'id')) });
	else
	  $createSVGElement (this.renderObject,
			     {"marker-mid": null});

      }
    },

    getCurved: function () {
      return this.curved;
    },

    getArrowed: function () {
      return this.arrowed;
    },

    toJSON: function () {
      var j = {};

      //j.levelData = dataView.getDataModel ().linkToJSON (this.aid);
      j.nofLevel = this.nofLevels;
      j.initState = this.getCurrentState ();
      j.weight = this.weight;
      j.color = this.color;
      j.curved = this.curved;
      j.arrowed = this.arrowed;
      j.aid = this.aid;
      j.swid = this.startBuoy.getDID ();
      j.ewid = this.endBuoy.getDID ();
      j.awid = this.assocBuoy ? this.assocBuoy.getDID () : -1;

      return j;
    },

    destroy: function () {
      this.setAssocBuoy (null);
      $removeNode (this.renderObject);
      this.dataView.getDataModel ().unlinkData (this.aid);
    },

    containsBuoy: function (b) {
      if (b === this.startBuoy || b === this.endBuoy)
	return true;
      return false;
    },

    isAssociatedBuoy: function (b) {
      if (b === this.assocBuoy)
	return true;
      return false;
    },

    getBuoys: function (b) {
      return [this.startBuoy, this.endBuoy];
    },

    hide: function () {
      $createSVGElement (this.renderObject, {display: 'none'});
    },

    show: function () {
      $createSVGElement (this.renderObject, {display: 'inline'});
    }
  });

  /// PimHerbartMindModel

  $defClass ("PimHerbartMindModel", {
    "extends": PiMind,

    constructor: function (dataView) {
      PiMind.call (this, dataView);

      var setLevelData = function (o, levelData) {
	if ($definedNonNull (levelData)) {
	  for (var i in levelData)
	    o.setLevelData (i, levelData [i]);
	}
      };

      var updateLevelData = function (o, nofLevels, isImport) {
	if (isImport) {
	  for (var i = nofLevels; i--; )
	    o.updateLevelData (i);
	}
      };

      var onAddWhile = function (self, msg) {
	var pos = ('pos' in msg) ? msg.pos : {x: 0, y:0};
	var nofLevels = 'nofLevels' in msg ? msg.nofLevels : 3;
	var initState = 'initState' in msg ? msg.initState : 0;
	var i;

	var b = new PimBuoy (pos, nofLevels, self.dataView,
			     'wid' in msg ? msg.wid : null);

	setLevelData (b, msg ['levelData']);
	updateLevelData (b, nofLevels, msg.isImport);
	updateAttrs (b, msg.state.attrs, initState, msg.isImport, msg.state);
	self.addWhileToArchive (b.getDID (), b);
	b.setCurrentState (initState, msg.data);
	self.sendEvent ('whileCreated', b);
	self.setReturnContainer ({wid: b.getDID ()});
      };

      var updateAttrs = function (b, attrs, st, isImport, importState) {
	var i;

	if (isImport) {
	  b.fromJSON ({state: {attrs: attrs, data: {},
                               fixed: importState ? importState.fixed : false}});
	} else
	  for (i in attrs)
	    b.setStateAttrs (i, attrs [i]);

	b.updateStateAttrs (st);
      };

      var onUpdateWhile = function (self, msg) {
	var b = self.getWhileFromArchive (msg.wid);

	if (!b) {
	  var desc = $omerge ({}, msg.desc);
	  desc.wid = msg.wid;
	  self.sendEvent ('addWhile', desc);
	  return;
	}

	setLevelData (b, msg.desc ['levelData']);
	updateAttrs (b, msg.desc.state.attrs, b.getCurrentState ());
	self.sendEvent ('whileUpdated', b);
      };

      var onRemoveWhile = function (self, msg) {
	var a, ai, w = self.getWhileFromArchive (msg.wid);
	var arch = self.getAssociationArchive ();

	for (ai in arch) {
	  a = arch [ai];
	  if (a.containsBuoy (w)) {
	    self.removeAssociation (a.getAID ());
	  }
	  if (a.isAssociatedBuoy (w)) {
	    a.setAssocBuoy (null);
	  }
	}

	w.destroy ();
	self.removeWhileFromArchive (msg.wid);
      };

      var onAssociateWhiles = function (self, msg) {
	var b1 = self.getWhileFromArchive (msg.wid1);
	var b2 = self.getWhileFromArchive (msg.wid2);
	var b3 = msg.wid3 &&  msg.wid3 !== -1 ? self.getWhileFromArchive (msg.wid3) : null;
	var nofLevels = 'nofLevels' in msg.desc ? msg.desc.nofLevels : 1;
	var initState = 'initState' in msg.desc ? msg.desc.initState : 0;

	var a = new PimBuoyAssociation (b1, b2, nofLevels, self.dataView,
					'aid' in msg.desc ? msg.desc.aid : null, null);

	self.addAssociationToArchive (a.getAID (), a);
	if ('color' in msg.desc) a.setColor (msg.desc.color);
	if ('weight' in msg.desc) a.setWeight (msg.desc.weight);
	if ('curved' in msg.desc) a.setCurved (msg.desc.curved);
	if ('arrowed' in msg.desc) a.setArrowed (msg.desc.arrowed);
	a.setCurrentState (initState);
	self.sendEvent ('associationCreated', a);
	a.setAssocBuoy (b3);
	self.setReturnContainer ({aid: a.getAID ()});
      };

      var onRemoveAssociation = function (self, msg) {
	var a = self.getAssociationFromArchive (msg.aid);
	a.destroy ();
	self.removeAssociationFromArchive (msg.aid);
      };

      var onUpdateAssociation = function (self, msg) {
	var a = self.getAssociationFromArchive (msg.aid);

	a.setColor (msg.desc.color);
	a.setWeight (msg.desc.weight);
	if ('curved' in msg.desc) a.setCurved (msg.desc.curved);
	if ('arrowed' in msg.desc) a.setArrowed (msg.desc.arrowed);
	if (msg.desc.annotation)
	  a.setAssocBuoy (msg.desc.annotation > -1 ? self.getWhileFromArchive (msg.desc.annotation) : null);

	self.sendEvent ('associationUpdated', a);
      };

      var onToJSON = function (self, selection) {
	var i, j = {};

	j.canvas = self.getDataView ().getCanvas ().toJSON ();

	j.dataModel = self.getDataView ().getDataModel ().toJSON (selection);

	var ws = [];
	for (i in self.whiles) {
	  if ($definedNonNull (selection)
	    && (selection.indexOf (self.whiles [i].getDID ()) == -1))
	    continue;
	  ws.push (self.whiles [i].toJSON ());
	}

	var as = [];
	for (i in self.associations) {
	  var jj = self.associations [i].toJSON ();
	  if ($definedNonNull (selection)
	    && (selection.indexOf (jj.swid) == -1
	      ||	 selection.indexOf (jj.ewid) == -1))
	    continue;
	  as.push (jj);
	}

	j.herbartModel = {whiles: ws, associations: as};

	$consoleLog (JSON.stringify (j));

	self.setReturnContainer (j);
      };

      var onFromJSON = function (self, args) {
	var json = args.json;
	var wb = args.wbase || 0;
	var ab = args.abase || 0;
	var diffPos;

	if (!args.inplace) {
	    self.getDataView ().getCanvas ().fromJSON (json.canvas);
	} else {
	    var posOld = self.getDataView ().getCanvas ().getTransform ().getPos ();
	    var posNew = new PimTransform (json.canvas).getPos ();
	    diffPos = [posNew[0] - posOld[0], posNew[1] - posOld[1]];
	}

	self.getDataView ().getDataModel ().fromJSON (json.dataModel, wb);

	var i;
	var ws = json.herbartModel.whiles;
	for (i = ws.length; i--;) {
	  ws [i].wid += wb;
	  ws [i].isImport = true;
	  self.addWhile (ws [i]);
	  if (args.inplace) {
	    var b = self.getWhileFromArchive (ws [i].wid);
	    var pos = b.getPos ();
	    b.setPos ([pos[0] + diffPos[0], pos[1] + diffPos[1]]);
	  }
	}

	var as = json.herbartModel.associations;
	for (i = as.length; i--;) {
	  as [i].aid += ab;
	  self.associateWhiles (as [i].swid + wb, as [i].ewid + wb, as [i],
                                as [i].awid !== -1 ? as [i].awid + wb : -1);
	}
      };

      var onClearMind = function (self) {
	var arch = self.getWhileArchive ();

	for (var i in arch) {
	  self.removeWhile (arch [i].getDID ());
	}

	self.getDataView ().getDataModel ().clean ();
      };

      var onFilterMind = function (self, msg) {
	var rb	 = $filterMap (self.getWhileArchive (), msg.fnBuoy, msg.selection);
	var re = $filterMap (self.getAssociationArchive (), msg.fnEdge, msg.selection);
	self.setReturnContainer ({'buoys': rb, 'edges':re});
      };

      var onGetBuoysByAttrs = function (self, msg) {
	self.setReturnContainer (self.filterMind (
          function (b, idx) {
	    var res = false;
	    for (var i in msg.attrs) {
	      var v = msg.attrs [i];
	      res = b.foldAttrs (function (attrs, s) {
		      return ((i in attrs) && (v === attrs [i])) || s; },
			         false) || res;
	    }
	    return res; },
	  falseF).buoys);
      };

      this.init = function () {
	if ($definedNonNull (dataView)) {
	  this.addModeHandlers ('default', {
	    'addWhile': onAddWhile,
	    'removeWhile' : onRemoveWhile,
	    'updateWhile': onUpdateWhile,
	    'associateWhiles': onAssociateWhiles,
	    'removeAssociation': onRemoveAssociation,
	    'updateAssociation': onUpdateAssociation,
	    'toJSON': onToJSON,
	    'fromJSON': onFromJSON,
	    'clearMind': onClearMind,
	    'filterMind': onFilterMind,
	    'getBuoysByAttrs' : onGetBuoysByAttrs
	  });
	}
      };

      this.init ();
    }
  });

  /// PimForm
  $defClass ("PimForm", {
    "extends": PimModeObservable,

    constructor: function (name, formContent, buttonText, addButtons, pos, z) {
      PimModeObservable.call (this);

      var ptr = this;

      this.div = null;
      this.form = null;
      this.pos = null;

      var onSubmit = function (ev) {
	ptr.sendEvent ('submit', ev);

	return false;
      };

      var onCancel = function (ev) {
	ptr.hide ();
	ptr.sendEvent ('cancel', ev);

	return false;
      };

      this.init = function () {
	if ($definedNonNull (pos))
	  this.pos = pos;

	ptr.div = $createHTMLElement ("div");
	var div = ptr.div;
	$setAttrs (ptr.div,
		   {'class':
		    $definedNonNull (pos) && (typeof pos === 'string') ?
		    'Form ' + pos : 'Form'});
	if (z) div.style.zIndex = z;
	// div.style.position = "absolute";
	// div.style.border = "2px solid #ff6e00";
	// div.style.backgroundColor = "white";

	var form = $createHTMLElement ("form");
	ptr.form = form;
	$setAttrs (form, {name: name});
	form.onsubmit = onSubmit;
	if ($definedNonNull (addButtons) && !addButtons) {
	  form.innerHTML = formContent;
	} else {
	  form.innerHTML = formContent + "<br /><input type='submit' value='"+ buttonText +"' />";
	  this.addButton ('button', 'cancel', 'Cancel', onCancel);
	}
	$addNode (ptr.div, form);

	div.style.display = "none";
	$addNode (document.body, div);
      };

      this.init ();
    },

    show: function () {
      var div = this.div;

      if (this.pos) {
	if (typeof this.pos === 'object') {
	  div.style.left = this.pos [0] + "px";
	  div.style.top = this.pos [1] + "px";
	}
      } else {
	// div.style.left = f_scrollLeft () + 30 + "px";
	// div.style.top = f_scrollTop () + 30 + "px";
      }
      div.style.display = "inline";
    },

    hide: function () {
      this.div.style.display = "none";
    },

    addButton: function (type, name, text, cb, cbKey) {
      var but = $createHTMLElement ("input");
      $setAttrs (but, {type: type, name: name, value: text});
      $addEventHandler (but, 'click', cb);
      $addEventHandler (but, 'keyup', cbKey);
      if (type === 'button') {
	but.innerHTML = text;
	$addNode (this.form, but);
      } else {
	var txt = $createHTMLElement ("span");
	txt.innerHTML = text;
	$addNode (this.form, txt);
	$addNode (txt, but);
	// txt.style.border = "1px solid black";
      }

      return but;
    },

    addList: function (name, title, lst, cbChange, cbClick) {
      var hlist = $createHTMLElement ("select");
      $setAttrs (hlist, {name: name, title: title});
      $addNode (this.form, hlist);
      for (var i = 0; i < lst.length; i++) {
	var opt = $createHTMLElement ("option");
	// $createElement (null, opt, {value: lst [i]});
	opt.innerHTML = lst [i];
	$addNode (hlist, opt);
      }
      hlist.onchange = cbChange;
      hlist.onclick = cbClick;

      return hlist;
    }
  });

  /// PimMenu
  $defClass ("PimMenu", {
    "extends": PimModeObservable,

    constructor: function (lst, title, el,
			   changeCb, clickCb) {
      PimModeObservable.call (this);

      var ptr = this;
      ptr.lastSelected = null;

      ptr.cont = $createHTMLElement ("dl");
      $addClass (ptr.cont, "dropdown");

      var head = $createHTMLElement ("dt");
      head.innerHTML = '<a href="#"><span>' + title +'</span></a>';

      var body = $createHTMLElement ("dd");
      var blist = $createHTMLElement ("ul");

      for (var i = 0; i < lst.length; i++) {
	var li = $createHTMLElement ("li");
	li.innerHTML = $mapTemplate ('<a href="#">%{name}<span class="value">%{value}</span></a>', {name: lst [i][0], value: lst[i][1]});
	$addNode (blist, li);
      }

      $addNode (body, blist);
      $addNode (ptr.cont, head);
      $addNode (ptr.cont, body);

      $hide (blist);

      var each = function (sel, cb) {
	$each ($selectElements (sel, ptr.cont), cb);
      };

      var eachClick = function (sel, cb) {
	each (sel, function (el) {
	  $addEventHandler (el, "click", cb);
	});
      };

      eachClick (".dropdown dt a", function () {
	each (".dropdown dd ul",
	      function (el) { $toggleVisibility (el); });
      });

      eachClick(".dropdown dd ul li a",
		function () {
		  var text = this.innerHTML;
		  $selectElements (".dropdown dt a span", ptr.cont)[0].innerHTML = text;
		  each (".dropdown dd ul", function (el) { $hide (el); });
		  if (ptr.lastSelected !== this) {
		    if (changeCb)
		      changeCb (ptr, this, ptr.lastSelected);
		    ptr.sendEvent ("change", {menu: ptr,
					      old: ptr.lastSelected,
					      'new': this});
		    ptr.lastSelected = this;
		  }
		  if (clickCb)
		    clickCb (ptr, this, ptr.lastSelected);
		  ptr.sendEvent ("click", {menu: ptr,
					   old: ptr.lastSelected,
					   'new': this});
		});

      $addEventHandler (document, "click",
			function (ev) {
			  if (!$foldMap ($parents (ev.target),
					 function (el, i, ret) {
					   if ($hasClass (el, "dropdown"))
					     return true;
					   return ret;
					 }, false)) {
			    each (".dropdown dd ul",
				  function (el) { $hide (el); });
			  }
			});

      if (el)
	$addNode (el, ptr.cont);
    },

    getSelectedValue: function () {
      return $selectElements ("dt a span.value", this.cont)[0].innerHTML;
    }
  });

  /// PimJournalLogger
  var STOP	= 0;
  var REC	= 1;
  var PLAY	= 2;

  $defClass ("PimJournalLogger", {
    "extends": PimState,

    constructor: function (mind) {
      PimState.call (this);

      var ptr = this;
      this.mind = mind;
      this.journal = null;
      this.mindSnaphot = null;
      this.playHooks = null;
      this.scheduler = null;
      this.playScope = null;
      this.speed = 1.0;
      this.useGlobal = true;

      this.history = [];

      this.init = function () {
	this.insertState (STOP, {data: null});
	this.insertState (REC, {data: null});
	this.insertState (PLAY, {data: null});
	this.scheduler = new PimScheduler (1);
      };

      this.init ();
    },

    addJournal: function (action, params) {
      if (this.getCurrentState () === REC) {
	var rec = {action : action, params:params,
		   timestamp: $time () };
	this.journal.push (rec);
	$consoleLog (rec);
      }
    },

    startRecJournal: function () {
      if (this.getCurrentState () === REC)
	return;
      this.setCurrentState (REC);
      this.journal = [];
      this.mindSnaphot = this.mind.toJSON ();
      this.addJournal ("init", 0);
    },

    stopRecJournal: function () {
      if (this.getCurrentState () !== REC)
	return;
      this.setCurrentState (STOP);
      this.history.push ([this.journal, this.mindSnaphot, this.speed]);
      this.journal = null;
      this.mindSnaphot = null;
    },

    toJSON: function () {
      return {history: this.history,
	      speed: this.speed,
	      useGlobal: this.useGlobal
	     };
    },

    fromJSON: function (data) {
      this.history = data.history;
      this.speed = data.speed;
      this.useGlobal = data.useGlobal;
    },

    setSpeed: function (speed) {
      this.speed = speed;
      if (!this.useGlobal
	&& this.history.length) {
	this.history [this.history.length - 1][2] = speed;
      }
    },

    getSpeed: function () {
      return this.speed;
    },

    setUseGlobal: function (ug) {
      this.useGlobal = ug;
    },

    getUseGlobal: function () {
      return this.useGlobal;
    },

    setPlayHooks: function (playHooks) {
      this.playHooks = playHooks;
    },

    startPlayJournal: function () {
      if (!this.history.length)
	return;

      var ptr = this;

      this.setCurrentState (PLAY);
      this.scheduler.addTask (new PimTask ({
	onInit: function (self) {
	  ptr.setCurrentStateData ({historyNo: 0, jidx: 0});
	  return 1;
	},

	onNext: function (self) {
	  var data = ptr.getCurrentStateData ();
	  var no = data.historyNo;

	  var history = ptr.history [no];
	  var jidx = data.jidx;

	  if (!jidx) {
	    ptr.mind.clearMind ();
	    ptr.mind.fromJSON (history [1]);
	    data.time = history [0][0].timestamp;
	    if (!ptr.useGlobal)
	      ptr.setSpeed (history [2]);
	  } else {
	    var act = history [0][jidx].action;
	    var args = history [0][jidx].params;

	    $pickf.apply (null, [act, ptr.playScope, ptr.playHooks].concat (args));
	  }

	  var t, oldT = data.time;

	  jidx ++;
	  if (jidx === history[0].length) {
	    jidx = 0;
	    no ++;
	    if (no === ptr.history.length)
	      return -1;
	    t = oldT + 1; // ptr.history [no][0][0].timestamp;
	  } else
	    t = history [0][jidx].timestamp;

	  data.time = t;
	  data.historyNo = no;
	  data.jidx = jidx;

	  return (t - oldT) / ptr.getSpeed ();
	},

	onLeave: function (self) {
	  ptr.setCurrentState (STOP);
	}
      }));
      this.scheduler.start ();
    },

    clearJournal: function () {
      this.history = [];
    },

    clearLast: function () {
      if (!this.history.length) return;
      this.history.pop ();
    },

    toLastJournal: function () {
      if (!this.history.length) return;

      this.mind.clearMind ();
      this.mind.fromJSON (this.history.pop () [1]);
    }
  });

  /// PimHerbartMindModelOperator

  $defClass ("PimHerbartMindModelOperator", {
    "extends" : PimMindOperator,

    constructor: function (mind, mode, elObserver) {
      PimMindOperator.call (this, mind);

      var ptr = this;

      this.newBuoyPos = null;
      this.newBuoyForm = null;
      this.buoyEdited = null;
      this.newAssocForm = null;
      this.assocEdited = null;
      this.importForm = null;
      this.exportForm = null;

      this.menuBar = null;
      this.mode = 0;
      this.selectedBuoys = [];
      this.extractAction = 0;

      this.journal = null;
      this.mindObserverEl = null;

      if (typeof (mode) === 'string') {
	if (mode === 'edit') {
	  mode = {
	    edit: true,
	    editBuoyAttrs: true,
	    menuBar: true,
	    buoyMove: true,
	    canvasMove: true,
	    canvasZoom: true,
	    buoyScroll: true,
	    sendButton: true,
	    menuBarShow: {
	      mode: true,
	      action: true,
	      file: true,
	      journal: true,
	      find: true
	    }
	  };
	} else if (mode === 'fixed') {
	  mode = {};
	} else {
	  mode = {
	    buoyMove: true,
	    canvasMove: true,
	    canvasZoom: true,
	    buoyScroll: true,
	    sendButton: true
	  };
	}
      } else {
	mode = mode || {};
      }

      var createObserver = function (elName) {
	var el = $getElementById (elName);

	if (!el) {
	  el = $createHTMLElement ("div");
	  el.id = elName;
	  $setAttrs (el, {'class': "Observer"});
	  el.style.display = "none";
	  $addNode (document.body, el);
	}

	if (!el.getElementsByTagName("iframe").length) {
	  var iframe = $createHTMLElement ("iframe");
	  $setAttrs (iframe, {'class': "Observer", 'frameborder': '0px'});
	  $addNode (el, iframe);
	}

	return el;
      };

      // todo: add scaling
      var screen2canvas = function (pt) {
	// var pos = mind.getDataView ().getCanvas ().getTransform ().getPos ();
	// var cPos = mind.getDataView ().getCanvas ().getTransform ().getCenterPos ();

	var canvas = mind.getDataView ().getCanvas ();
	var root = canvas.paper;
	var cont = canvas.globalGroup;
	var p = root.createSVGPoint();

	p.x = pt [0];
	p.y = pt [1];

	p = p.matrixTransform(cont.getCTM().inverse());

	return [p.x, p.y];
	// return [p.x /*p [0] - pos [0] + cPos [0]*/, p.y /*p [1] - pos [1] + cPos [1]*/];
      };

      var canvas2screen = function (pt) {
	// var pos = mind.getDataView ().getCanvas ().getTransform ().getPos ();
	//var cPos = mind.getDataView ().getCanvas ().getTransform ().getCenterPos ();

	var canvas = mind.getDataView ().getCanvas ();
	var root = canvas.paper;
	var cont = canvas.globalGroup;
	var p = root.createSVGPoint();

	p.x = pt [0];
	p.y = pt [1];

	p = p.matrixTransform(cont.getCTM());

	return [p.x, p.y];
	// return [p [0] + pos [0] - cPos [0], p [1] + pos [1] - cPos [1]];
      };

      /////////////////////////
      // Simple actions part //
      /////////////////////////

      var buoyState = function (b, l) {
	switch (l) {
	  case 0:
	  case "0":
	  buoyState0 (b);
	  break;
	  case 1:
	  case "1":
	  buoyState1 (b);
	  break;
	  case 2:
	  case "2":
	  buoyState2 (b);
	  break;
	  default:
	  break;
	}
      };
      PimLib.buoyState = buoyState;

      var buoyState1 = function (b) {
	b.updateStateAttrs (1);
	b.setCurrentState (1, {operator: ptr, mind: mind});
	b.moveOnTop ();
	ptr.journal.addJournal ("buoyState1", [b.getDID ()]);
      };
      PimLib.buoyState1 = buoyState1;

      var buoyFixed = function (b, s) {
	b.setFixed (s);
	ptr.journal.addJournal ("buoyFixed", [b.getDID (), s]);
      };
      PimLib.buoyFixed = buoyFixed;

      var buoyState0 = function (b) {
	b.updateStateAttrs (0);
	b.setCurrentState (0, {operator: ptr, mind: mind});
	b.showComObject ();
	ptr.journal.addJournal ("buoyState0", [b.getDID ()]);
      };
      PimLib.buoyState0 = buoyState0;

      var buoyState2 = function (b) {
	b.hideComObject ();
	b.updateStateAttrs (2);
	b.setCurrentState (2, {operator: ptr, mind: mind});
	if (ptr.mode === 2 || ptr.mode === 5) {
	  // ptr.mindObserverEl.innerHTML = b.getLevelData (2);
	  var ifr = ptr.mindObserverEl.getElementsByTagName("iframe") [0];
	  ifr.contentDocument.body.innerHTML = b.getLevelData (2);
	}
	ptr.journal.addJournal ("buoyState2", [b.getDID ()]);
      };
      PimLib.buoyState2 = buoyState2;

      var buoySelect = function (b) {
	var idx = ptr.selectedBuoys.indexOf (b);
	if (idx === -1) {
	  b.mark ();
	  ptr.selectedBuoys.push (b);
	} else {
	  b.unmark ();
	  ptr.selectedBuoys.splice (idx, 1);
	}
	ptr.journal.addJournal ("buoySelect", [b.getDID ()]);
      };
      PimLib.buoySelect = buoySelect;

      var buoyEdit = function (b) {
	ptr.buoyEdited = b;
	ptr.newBuoyForm.setMode ('edit');
        if (window.tinymce) {
          tinymce.EditorManager.get ('level0').setContent (b.getLevelData (0) || '');
          tinymce.EditorManager.get ('level1').setContent (b.getLevelData (1) || '');
          tinymce.EditorManager.get ('level2').setContent (b.getLevelData (2) || '');
        } else {
	  document.newBuoyForm.level0.value = b.getLevelData (0);
	  document.newBuoyForm.level1.value = b.getLevelData (1);
	  document.newBuoyForm.level2.value = b.getLevelData (2);
        }

	setFormBuoyAttrs (document.newBuoyForm, b);

	ptr.newBuoyForm.show ();
      };
      PimLib.buoyEdit = buoyEdit;


      var buoyMove = function (b, d) {
	var canvas = mind.getDataView ().getCanvas ();
	var root = canvas.paper;
	var cont = canvas.globalGroup;
	var t = cont.getCTM();

	var pos = b.getPos ();
	b.setPos ([pos [0] + d [0] / t.a, pos [1] + d [1] / t.d]);
	ptr.journal.addJournal ("buoyMove", [b.getDID (), d]);
      };
      PimLib.buoyMove = buoyMove;

      var buoyScroll = function (b, dy) {
	b.scrollContent (0, dy);
	ptr.journal.addJournal ("buoyScroll", [b.getDID (), dy]);
      };
      PimLib.buoyScroll = buoyScroll;

      var assocShowBuoy = function (a, d) {
	var ab = a.getAssocBuoy ();
	if (ab) {
	  ab.show ();
	  ab.setPos (screen2canvas (d));
	}
	ptr.journal.addJournal ("assocShowBuoy", [a.getAID (), d]);
      };
      PimLib.assocShowBuoy = assocShowBuoy;

      var assocEdit = function (a) {
	ptr.assocEdited = a;
	ptr.newAssocForm.setMode ("edit");
	document.newAssocForm.color.value = a.getColor ();
	document.newAssocForm.weight.value = a.getWeight ();
	document.newAssocForm.annot.checked = 'checked';
	document.newAssocForm.curved.checked = a.getCurved () ? 'checked' : '';
	document.newAssocForm.arrowed.checked = a.getArrowed () ? 'checked' : '';

	ptr.newAssocForm.show ();
      };
      PimLib.assocEdit = assocEdit;

      var canvasMove = function (d) {
        var tr = mind.getDataView ().getCanvas ().getTransform ();
        var pos = tr.getPos ();
        tr.set ({pos: [pos [0] + d [0], pos [1] + d [1]]});
        mind.getDataView ().getCanvas ().setTransform (tr);

        ptr.journal.addJournal ("canvasMove", [d]);
      };
      PimLib.canvasMove = canvasMove;

      var canvasZoom = function (pt, z) {
        var canvas = mind.getDataView ().getCanvas ();
        var root = canvas.paper;
        var cont = canvas.globalGroup;
        var p = root.createSVGPoint();

        p.x = pt [0];
        p.y = pt [1];

        p = p.matrixTransform(cont.getCTM().inverse());

        var k = root.createSVGMatrix().translate(p.x, p.y).scale(z [0], z [1]).translate(-p.x, -p.y),
	    t = cont.getCTM().multiply(k);

	var transform = 'matrix(' + t.a + ", 0, 0," + t.d + "," + t.e + "," + t.f + ")";
	$createSVGElement (cont, {'transform': transform});

	ptr.journal.addJournal ("canvasZoom", [p, z]);
      };
      PimLib.canvasZoom = canvasZoom;

      var canvasNewBuoyEdit = function (p) {
	ptr.newBuoyPos = p;
	ptr.newBuoyForm.show ();
      };
      PimLib.canvasNewBuoyEdit = canvasNewBuoyEdit;

      var buoyNew = function (cfg) {
	ptr.journal.addJournal ("buoyNew", [cfg]);
	var res = mind.addWhile ($omerge (cfg, {data: {operator: ptr, mind: mind}}, {}));
	ptr.newBuoyForm.hide ();
        return res.wid;
      };
      PimLib.buoyNew = buoyNew;

      var buoyUpdate = function (b, cfg, initState) {
        var s;
	mind.updateWhile (b.getDID (), cfg);
	ptr.newBuoyForm.hide ();
	ptr.newBuoyForm.setMode ('new');
        if (initState) {
          s = 0;
        } else {
	   s = b.getCurrentState ();
        }
	b.setCurrentState (null);
	b.updateStateAttrs (s);
	b.setCurrentState (s, {operator: ptr, mind: mind});
	b.showComObject ();
	ptr.journal.addJournal ("buoyUpdate", [b.getDID (), cfg, initState || false]);
      };
      PimLib.buoyUpdate = buoyUpdate;

      var assocNew = function (cfg) {
	ptr.newAssocForm.hide ();

	mind.associateWhiles.apply (mind, cfg /*[0], cfg [1], cfg [2], cfg [3]*/);

	unmarkAll ();
	ptr.journal.addJournal ("assocNew", [cfg]);
      };
      PimLib.assocNew = assocNew;

      var assocUpdate = function (a, cfg) {
	mind.updateAssociation (a.getAID (), cfg);

	ptr.newAssocForm.hide ();
	ptr.newAssocForm.setMode ('new');
	ptr.journal.addJournal ("assocUpdate", [a.getAID (), cfg]);
      };
      PimLib.assocUpdate = assocUpdate;

      var removeBuoy = function (b) {
	ptr.journal.addJournal ("removeBuoy", [b.getDID ()]);
	mind.removeWhile (b.getDID ());
      };
      PimLib.removeBuoy = removeBuoy;

      var removeAssoc = function (a) {
	ptr.newAssocForm.hide ();
	ptr.newAssocForm.setMode ('new');
	ptr.journal.addJournal ("removeAssoc", [a.getAID ()]);
        mind.removeAssociation (a.getAID ());
      };
      PimLib.removeAssoc = removeAssoc;

      var buoyVisibility = function (b, v) {
        if (v)
	  b.show ();
        else
	  b.hide ();
        ptr.journal.addJournal ("buoyVisibility", [b.getDID (), v]);
      };
      PimLib.buoyVisibility = buoyVisibility;

      var assocVisibility = function (a, v) {
        if (v)
          a.show ();
        else
          a.hide ();
        ptr.journal.addJournal ("assocVisibility", [a.getAID (), v]);
      };
      PimLib.assocVisibility = assocVisibility;

      var preparePitchData = function (b, did) {
        var dataModel = b.dataView.getDataModel ();
        var datas = dataModel.getDatas (did, $range (0, 3));

        var ret =
              $foldMap (datas,
	                function (text, level, ret) {
                          ret.push ([b.getStateAttr (level, 'levelName'), text]);
                          return ret;
	                }, []);
        return ret;
      };

      var buoyPitch = function (b) {
        window.PimContentToSave = preparePitchData (b, b.getDID ()); // b; // .dataView.getDataModel ().toJSON ();
        var w = $openWin ("#pitch=" + b.getDID () + (mode.showNameInPitch ? '&true' : ''), "_blank");
        w.focus ();
        ptr.journal.addJournal ("buoyPitch", [b.getDID ()]);
      };
      PimLib.buoyPitch = buoyPitch;

      var sqr = function (x) {return x * x;};

      var buoyDistance = function (b, p) {
	var p1 = canvas2screen (b.getPos ());

	return sqr (p1 [0] - p [0]) +
	  sqr (p1 [1] - p [1]);
      };
      PimLib.buoyDistance = buoyDistance;

      // todo: add some effects - move, zoom in/out ...
      var doMove = function (b) {
	var canvas = mind.getDataView ().getCanvas ();
	var tr = canvas.getTransform ();
	var s = tr.getScale ();
	var cPos = [canvas.width / 2, canvas.height / 2];
	var pos = b.getPos ();
	tr.set ({pos: [cPos [0] - pos [0] * s [0], cPos [1] - pos [1] * s [1]]});
	canvas.setTransform (tr);
      };

      var centerViewToBuoy = function (b) {
        doMove (b);
        ptr.journal.addJournal ("centerViewToBuoy", [b.getDID ()]);
      };
      PimLib.centerViewToBuoy = centerViewToBuoy;

      var assocMoveToBuoy = function (a, d) {
	var bs = a.getBuoys ();
	var d1 = buoyDistance (bs [0], d);
	var d2 = buoyDistance (bs [1], d);

	if (d1 > d2)
	  doMove (bs [0]);
	else
	  doMove (bs [1]);

	ptr.journal.addJournal ("assocMoveToBuoy", [a.getAID (), d]);
      };
      PimLib.assocMoveToBuoy = assocMoveToBuoy;

      var getBuoyAttrLevelVals = function (b, attr) {
	return $fold ($range (0, b.nofLevels),
		      function (l, _, res) {
			res [l] = b.getStateAttr (l, attr);
			return res;
		      }, []);
      };
      PimLib.getBuoyAttrLevelVals = getBuoyAttrLevelVals;

      var setBuoyAttrLevelVals = function (b, attr, vals) {
	var v = {};
	v [attr] = vals;
	buoyUpdate (b, {state: {attrs: v}});
      };
      PimLib.setBuoyAttrLevelVals = setBuoyAttrLevelVals;

      var buoyCreateCopy = function (b) {
        var pos = b.getPos (), i;
        var attrs = {};
        var datas = {};

        for (i = PimBuoy.prototype.levelAttrs.length; i--;) {
          var attr = PimBuoy.prototype.levelAttrs [i];
          attrs [attr ["name"]] = new Array (b.nofLevels);
        }

        for (i = b.nofLevels; i--; ) {
          datas [i] = b.getLevelData(i) || "";
          var attr = b.getStateAttrs(i);
          for (var a in attr) {
            if (attr.hasOwnProperty (a)) {
              attrs [a][i] = attr [a];
            }
          }
        }

        var wid = buoyNew ({
          pos: { x: pos [0], y: pos [1] - 10 },
          nofLevels: b.nofLevels,
          initState: 0,
          levelData: datas,
          state: {
            attrs: attrs
          }
        });

        var newB = mind.getWhileFromArchive (wid);
        newB.moveOnTop ();
        return newB;
      };
      PimLib.buoyCreateCopy = buoyCreateCopy;

      ///////////////////

      var addWhileHandlers = function (m, b) {
	var ef = b.getEventFeeder ();
	var efs = new PimEventFeederState (ef);
	var moved = false;

	efs.addHandler ('componentChange', function (es, ev) {
          if (PimLocalState.lastActive &&
              PimLocalState.lastActive !== b &&
              !PimLocalState.lastActive.getFixed ()) {
            buoyState0 (PimLocalState.lastActive);
          }
	  if (efs.lastEventType === 'mouseover') {
	    if (b.getCurrentState () === 1 || b.getCurrentState () === 2)
	      return;
	    buoyState1 (b);
            PimLocalState.lastActive = b;
	  } else if (efs.targetEl) {
	    // hack improve it!!
	    if (efs.targetEl.localName === 'svg'
	      || b.getCurrentState () !== 2) {
	      if (b.getFixed ()) {
		if (ev.ctrlKey)
		  buoyFixed (b, false);
	      }
	      if (!b.getFixed ()) {
		buoyState0 (b);
	      }
	      ef.stop = true;
	    }
	  }
	});

	ef.addHandlerClickOrDblClick (
          function (e, msg) {
	    var mode = (b.frozenMode > -1) ? b.frozenMode : ptr.mode;
	    switch (mode) {
	      case 0:
	      case 2:
	      case 4:
              case 5:
	      if (!moved) {
	        buoyState2 (b);
	        ef.stop = false;
	        if (msg.event.ctrlKey) {
		  buoyFixed (b, true);
	        }
	      } else
	        moved = false;
	      break;
	      case 1:
	      buoySelect (b);
	      break;
	      case 3:
	      buoyPitch (b);
	      break;
	    }
	  },
	  function (e, msg) {
	    if (mode.edit) {
	      buoyEdit (b);
	    }
	  });

	if (mode.buoyMove) {
	  efs.addHandler ('mouseMove', function (es, ev) {
	    if (efs.mouseButton [MOUSE_BUTTON_LEFT]) {
	      buoyMove (b, [efs.getDeltaX (), efs.getDeltaY ()]);
	      moved = true;
	      $evtStop (ev);
	    }
	  });
	}

	if (mode.buoyScroll) {
	  ef.addHandler ('mousewheel', function (es, msg) {
	    var dy = mouseNormalizeWheelData (msg.event) < 0 ? -10 : 10;
	    buoyScroll (b, dy);
	    $evtStop (msg.event);
	  });
	}
      };

      var addAssocHandlers = function (m, a) {
	var ef = a.getEventFeeder ();
	var efs = new PimEventFeederState (ef);

	ef.addHandlerClickOrDblClick (
	  function (e, msg) {
	    if (ptr.mode === 4)
	      assocMoveToBuoy (a, [msg.event.pageX, msg.event.pageY]);
	    else
	      assocShowBuoy (a, [msg.event.pageX, msg.event.pageY]);
	  },
	  function (e, msg) {
	    if (mode.edit) {
	      assocEdit (a);
	    }
	  }
	);

	a.addHandler ('assocBuoyChanged', function (_, msg) {
	  if (msg.new) {
	    msg.new.assocHandler  = msg.new.addHandler ('changeState',
			                                function (b, msg) {
			                                  if (msg.newState === 0)
				                            b.hide ();
			                                });
	  }

	  if (msg.old)
	    msg.old.removeHandler ('changeState', msg.old.assocHandler);
	});
      };

      var addCanvasHandlers = function () {
	var canvasEvFeeder = mind.getDataView ().getCanvas ().getEventFeeder ();
	var cefState = ptr.getEvFeederState (); // new PimEventFeederState (canvasEvFeeder);

	if (mode.canvasMove) {
	  cefState.addHandler ('mouseMove', function (es, ev) {
	    if (cefState.mouseButton [MOUSE_BUTTON_LEFT]) {
	      canvasMove ([cefState.getDeltaX (), cefState.getDeltaY ()]);
	    }
	  });
	}

	if (mode.canvasZoom) {
	  canvasEvFeeder.addHandler ('mousewheel', function (es, msg) {
	    var zoom = mouseNormalizeWheelData (msg.event) < 0 ? 0.95 : 1.05;
	    canvasZoom ([ cefState.mouseXPage, cefState.mouseYPage ], [zoom, zoom]);
	  });
	}

	if (mode.edit) {
	  canvasEvFeeder.addHandler ('dblclick', function (es, msg) {
	    canvasNewBuoyEdit ([ cefState.mouseXPage, cefState.mouseYPage ]);
	  });
	  // hot keys
	  // @todo: make it better
	  $addEventHandler (window, 'keydown', function (ev) {
	    ev = ev || window.event;
	    if (ev.altKey) {
	      if (ev.keyCode === 66) {
		canvasNewBuoyEdit ([ cefState.mouseXPage, cefState.mouseYPage ]);
		return $evtStop (ev);
	      }
	      if (ev.keyCode === 65) {
		ptr.newAssocForm.show ();
		return $evtStop (ev);
	      }
	      if (ev.keyCode === "E".charCodeAt (0)) {
		document.menuBar.mode.selectedIndex = 0;
		setModeState (document.menuBar.mode);
		return $evtStop (ev);
	      }
	      if (ev.keyCode === "S".charCodeAt (0)) {
		document.menuBar.mode.selectedIndex = 1;
		setModeState (document.menuBar.mode);
		return $evtStop (ev);
	      }
	      if (ev.keyCode === "O".charCodeAt (0)) {
		document.menuBar.mode.selectedIndex = 2;
		setModeState (document.menuBar.mode);
		return $evtStop (ev);
	      }
	      if (ev.keyCode === "P".charCodeAt (0)) {
		document.menuBar.mode.selectedIndex = 3;
		setModeState (document.menuBar.mode);
		return $evtStop (ev);
	      }
	      if (ev.keyCode === "X".charCodeAt (0)) {
		document.menuBar.mode.selectedIndex = 4;
		setModeState (document.menuBar.mode);
		return $evtStop (ev);
	      }
	    }
	    return null;
	  });
	}
      };

      var setFormLevelProp = function (form, b, attr, props) {
	var nofLevels = b.nofLevels;
	for (var i = nofLevels; i--;) {
	  var a = b.getStateAttr (i, attr);
	  if (props.length > 1) {
	    for (var j = props.length; j--; )
	      if (a) form.elements [props [j] + i].value = a [j];
	  } else
	    form.elements [props [0] + i].value = a;
	}
      };

      var getFormLevelProp = function (form, nofLevels, props) {
	var p = new Array (nofLevels);

	for (var i = nofLevels; i--;) {
	  if (props.length > 1) {
	    var pp = new Array (props.length);
	    for (var j = props.length; j--;) {
	      pp [j] = form.elements [props [j] + i].value;
	    }
	    p [i] = pp;
	  } else
	    p [i] = form.elements [props[0] + i].value;
	}

	return p;
      };

      var makeFormBuoyAttrs = function (form) {
	var attrs = {};

	if (mode.editBuoyAttrs) {
	  for (var i = PimBuoy.prototype.levelAttrs.length; i--;) {
	    var attr = PimBuoy.prototype.levelAttrs [i];
	    if (attr ["fname"].length)
	      attrs [attr ["name"]] = getFormLevelProp (form, 3, attr ["fname"]);
	  }
	}

	return attrs;
      };

      var setFormBuoyAttrs = function (form, b) {
	if (mode.editBuoyAttrs) {
	  for (var i = PimBuoy.prototype.levelAttrs.length; i--;) {
	    var attr = PimBuoy.prototype.levelAttrs [i];
	    if (attr ["fname"].length) setFormLevelProp (form, b, attr ["name"], attr ["fname"]);
	  }
	}
      };

      var addNewBuoy = function (es, msg) {
	var p = screen2canvas (ptr.newBuoyPos), levelData;

        if (window.tinymce) {
          levelData = {
	    0: tinymce.EditorManager.get ('level0').getContent (),
	    1: tinymce.EditorManager.get ('level1').getContent (),
	    2: tinymce.EditorManager.get ('level2').getContent ()
	  };
        } else {
          levelData = {
	    0: document.newBuoyForm.level0.value,
	    1: document.newBuoyForm.level1.value,
	    2: document.newBuoyForm.level2.value
	  };
        }

	buoyNew ({
	  pos: { x: p [0],
		 y: p [1]},
	  nofLevels: 3,
	  initState: 0,
	  levelData : levelData,
	  state: {
	    attrs: makeFormBuoyAttrs (document.newBuoyForm)
	  }
	});

	return false;
      };

      var editBuoy = function (es, msg) {
        var levelData;

        if (window.tinymce) {
          levelData = {
	    0: tinymce.EditorManager.get ('level0').getContent (),
	    1: tinymce.EditorManager.get ('level1').getContent (),
	    2: tinymce.EditorManager.get ('level2').getContent ()
	  };
        } else {
          levelData = {
	    0: document.newBuoyForm.level0.value,
	    1: document.newBuoyForm.level1.value,
	    2: document.newBuoyForm.level2.value
	  };
        }

	buoyUpdate (ptr.buoyEdited, {
	  levelData : levelData,
	  state: {
	    attrs: makeFormBuoyAttrs (document.newBuoyForm)
	  }
	}, true);
      };

      var makeFormBuoyFromAttrs = function (level) {
	var i, s = "";
	if (mode.editBuoyAttrs) {
	  var sorted = new Array (PimBuoy.prototype.levelAttrs.length);

	  for (i = PimBuoy.prototype.levelAttrs.length; i--;)
	    sorted [PimBuoy.prototype.levelAttrs [i]["fpos"]] = i;

	  for (i = PimBuoy.prototype.levelAttrs.length; i--;) {
	    var attr = PimBuoy.prototype.levelAttrs [sorted [i]];
	    s = "</div>" + s;
	    for (var j = attr ["fname"].length; j--;) {
	      s = $mapTemplate (
		"%{label}:<input type='text' name='%{name}%{lev}' "
	+ "value='%{val}' size='%{size}'/>",
		{
		  label: attr["lname"][j],
		  name: attr["fname"][j],
		  lev: level,
		  val: attr ["fname"].length == 1 ?
		    attr ["init"](level)
		     : attr ["init"](level) [j],
		  size: attr ["isize"][j],
		  type: attr ["type"]
		}) + s;
	    }
	    if (attr ["lname"].length) s =	 "<div class='hidable'>" + s;
	  }
	}
	s = s + $mapTemplate ("<br /><textarea name='level%{lev}' class='Level%{lev}'></textarea>", {
	  lev: level
	});
	return s;
      };

      var _hidden = false;
      var hideShowInput = function () {
	var els = document.newBuoyForm.getElementsByClassName ("hidable");
	for (var i = els.length; i--;)
	  els [i].style.display = _hidden ? "block" : "none";
	_hidden = !_hidden;
      };

      var addNewBuoyForm = function () {
	var tpl1 = makeFormBuoyFromAttrs (0),
	    tpl2 = makeFormBuoyFromAttrs (1),
	    tpl3 = makeFormBuoyFromAttrs (2);

	ptr.newBuoyForm = new PimForm
	(
	  "newBuoyForm",
	  $mapTemplate ("<table>\
<tr>\
<td><b>Layer passive:</b></td>\
<td><b>Layer focused:</b></td>\
<td><b>Layer active:</b></td>\
</tr>"
		       + "<tr>"
		       + "<td><a href='javascript:void(0);' id='attr-hide-show'>-show</a></td>"
		       + "<td></td><td></td></tr>"
		       + "<tr> <td valign='top'>\
%{tpl1}\
</td><td valign='top'>\
%{tpl2}\
</td><td valign='top'>\
%{tpl3}\
</td></tr></table>", {tpl1: tpl1, tpl2: tpl2, tpl3: tpl3}),
	  "Archive a While");
	ptr.newBuoyForm.addModeHandlers ('new', {'submit': addNewBuoy });
	ptr.newBuoyForm.addModeHandlers ('edit', {'submit': editBuoy });
        ptr.newBuoyForm.addModeHandlers ('edit', {'cancel': function () { buoyState0 (ptr.buoyEdited); } });
	ptr.newBuoyForm.setMode ('new');
	hideShowInput ();
	$addEventHandler ($getElementById ("attr-hide-show"), "click",
			  function (ev) {
			    if (!_hidden)
			      this.innerHTML = "-show";
			    else
			      this.innerHTML = "+hide";
			    hideShowInput ();
			  });
      };

      var unmarkAll = function () {
	for (var i = ptr.selectedBuoys.length; i--;)
	  ptr.selectedBuoys [i].unmark ();

	ptr.selectedBuoys = [];
      };

      var addNewAssoc = function (es, msg) {
	ptr.newAssocForm.hide ();
	if (ptr.selectedBuoys.length < 2)
	  return false;

	var ab = document.newAssocForm.annot.checked ?
	  (ptr.selectedBuoys [2] ? ptr.selectedBuoys [2].getDID () : -1) : -1;
	assocNew ([ptr.selectedBuoys [0].getDID (),
		   ptr.selectedBuoys [1].getDID (), {
		     color: document.newAssocForm.color.value,
		     weight: document.newAssocForm.weight.value,
		     curved: document.newAssocForm.curved.checked,
		     arrowed: document.newAssocForm.arrowed.checked
		   }, ab]);

	return false;
      };

      var editNewAssoc = function () {
	var desc = {
	  color: document.newAssocForm.color.value,
	  weight: document.newAssocForm.weight.value,
	  curved: document.newAssocForm.curved.checked,
	  arrowed: document.newAssocForm.arrowed.checked
	};

	if (document.newAssocForm.annot.checked) {
	  if (ptr.selectedBuoys.length)
	    desc ['annotation'] = ptr.selectedBuoys [0].getDID ();
	} else {
	  desc ['annotation'] = -1;
	}

	assocUpdate (ptr.assocEdited, desc);
        ptr.assocEdited = null;
      };

      var addNewAssocForm = function () {
	ptr.newAssocForm = new PimForm
	("newAssocForm",
	 "<table>"
         + "<tr>"
         + "<td>Weight:</td>"
         + "<td><input type='text' name='weight' value='1' /></td>"
         + "</tr>"
         + "<tr>"
	 + "<td>Color:</td>"
	 + "<td><input type='text' name='color' value='#009cff' /></td"
	 + "</tr>"
	 + "<tr>"
	 + "<td>Annotation:</td>"
	 + "<td><input type='checkbox' name='annot' checked='checked'/>"
	 + "</tr>"
	 + "<tr>"
	 + "<td>Curved:</td>"
	 + "<td><input type='checkbox' name='curved' checked='checked'/>"
	 + "</tr>"
	 + "<tr>"
	 + "<td>Arrowed:</td>"
	 + "<td><input type='checkbox' name='arrowed' checked='checked'/>"
	 + "</table>"
	, "Archive Association");
	ptr.newAssocForm.addModeHandlers ('new', {'submit': addNewAssoc });
	ptr.newAssocForm.addModeHandlers ('edit', {'submit': editNewAssoc });
	ptr.newAssocForm.setMode ('new');
        ptr.newAssocForm.addButton ("button", "delete", "Delete", function () {
          if (ptr.assocEdited) {
            removeAssoc (ptr.assocEdited);
          }
        });

      };

      var addImportForm = function () {
	ptr.importForm = new PimForm ("importForm",
		                      "<textarea name='input'></textarea>",
		                      "Import");
	ptr.importForm.addModeHandlers ('import', {'submit': importFile});
	ptr.importForm.setMode ('import');
      };

      var importFile = function () {
	var strFile = document.importForm.input.value;
	var wb = mind.getDataView ().getDataModel ().getMaxDid ();
	var ab = mind.getDataView ().getDataModel ().getMaxLid ();

	if (!ptr.importForm.inplace) {
	    mind.fromJSON (JSON.parse (strFile), wb, ab);
	} else {
	    mind.fromJSON (JSON.parse (strFile), wb, ab, true);
	}
	ptr.importForm.hide ();
	return false;
      };

      var addExportForm = function () {
	ptr.exportForm = new PimForm ("exportForm",
		                      "<p>Please copy the content to import area of destination pi-mind.</p>"
	+ "<textarea name='output'></textarea>",
				      "OK");
	ptr.exportForm.addModeHandlers ('export',
		                        {'submit': function () {
		                           ptr.exportForm.hide ();
		                           return false;}});
	ptr.exportForm.setMode ('export');
      };

      var exportMind = ptr.exportMind = function () {
	var selection = null;

	if (ptr.selectedBuoys.length) {
	  selection = new Array (ptr.selectedBuoys.length);

	  for (var i = ptr.selectedBuoys.length; i--;)
	    selection [i] = ptr.selectedBuoys [i].getDID ();
	}
	unmarkAll ();
	return JSON.stringify (ptr.toJSON (selection));
      };

      var removeBuoys = ptr.removeBuoys = function () {
	for (var i = ptr.selectedBuoys.length; i--;) {
	  removeBuoy (ptr.selectedBuoys [i]);
	}

	ptr.selectedBuoys = [];
      };

      var copyBuoys = ptr.copyBuoys = function () {
	for (var i = ptr.selectedBuoys.length; i--;) {
	  buoyCreateCopy (ptr.selectedBuoys [i]);
	}

	unmarkAll ();
	ptr.selectedBuoys = [];
      };

      var setModeState = function (sel) {
	ptr.mode = sel.selectedIndex;
	if (ptr.mode === 2 || ptr.mode === 5) {
	  ptr.mindObserverEl.style.display = "inline";
          if (ptr.mode === 2) {
            $setAttrs (ptr.mindObserverEl, {'class': "Observer"});
            $setAttrs (ptr.mindObserverEl.getElementsByTagName("iframe")[0], {'class': "Observer"});
          } else {
            $setAttrs (ptr.mindObserverEl, {'class': "ObserverFloor"});
            $setAttrs (ptr.mindObserverEl.getElementsByTagName("iframe")[0], {'class': "ObserverFloor"});
          }
	} else {
	  ptr.mindObserverEl.style.display = "none";
	}
      };

      var addMenuBar = function () {
	ptr.menuBar = new PimForm ("menuBar", "", "", false, 'menu-bar');
	// ptr.menuBar.addButton ("checkbox", "mode", "Selection mode:", function () { ptr.mode ^= 1; });

	if (mode.menuBarShow && mode.menuBarShow.mode) {
	  ptr.menuBar.addList ("mode", "Mode", ["Edit", "Select", "Observe", "Pitch", "Explore", "Observe Floor"], function () {
	    setModeState (this);
	  });
	}

	if (mode.menuBarShow && mode.menuBarShow.action) {
	  ptr.menuBar.addList ("action", "Action", ["Create Assoc", "Copy While", "Remove While", "Edit Attrs"], emptyF, function () {
	    switch (this.selectedIndex) {
	      case 0:
	      ptr.newAssocForm.show ();
	      $hide (ptr.menuAttrsDiv);
	      break;
              case 1:
              copyBuoys ();
              $hide (ptr.menuAttrsDiv);
              break;
	      case 2:
	      removeBuoys ();
	      $hide (ptr.menuAttrsDiv);
	      break;
	      case 3:
	      $show (ptr.menuAttrsDiv);
	      break;
	    }
	  });
	}

	/*
if (window.File
&& window.FileReader
&& window.FileList
&& window.Blob) {
var fl = ptr.menuBar.addButton ("file", "files[]",
"Import:", emptyF);
$addEventHandler (fl, 'change', function (evt) {
var f = evt.target.files [0];
var reader = new FileReader ();

reader.onload = function (e) {
importFile (e.target.result);
};

reader.readAsBinaryString (f);
});
}
	 */

	if (mode.menuBarShow && mode.menuBarShow.file) {
	  ptr.menuBar.addList ("file", "File", ["Save", "Save deep", "Import", "Import inplace", "Export"], emptyF, function () {
	    switch (this.selectedIndex) {
              case 0:
              PimSaver.prototype.saveByURI (JSON.stringify (ptr.toJSON ()));
              break;
	      case 1:
	      window.PimContentToSave = JSON.stringify (ptr.toJSON ());
	      window.location.hash = "";
	      var w = $openWin ("#save", "Save Archive",
	                        window.location.toString ().replace ("#", ""));
	      w.focus ();
	      break;
	      case 2:
	      ptr.importForm.inplace = false;
	      ptr.importForm.show ();
	      break;
	      case 3:
	      ptr.importForm.inplace = true;
	      ptr.importForm.show ();
	      break;
	      case 4:
	      document.exportForm.output.value = exportMind ();
	      ptr.exportForm.show ();
	      break;
	    }
	  });
	}

	var doPlayJournal = ptr.doPlayJournal = function () {
	  ptr.journal.stopRecJournal ();
	  $consoleLog (ptr.toJSON ());
	  window.PimContentToSave = JSON.stringify (ptr.toJSON ());
	  var w = $openWin ("#journal", "Play Journal");
	  w.focus ();
	};

	if (mode.menuBarShow && mode.menuBarShow.journal) {
	  var journalCB = function (selectedIndex, change) {
		switch (selectedIndex) {
		  case 0:
		  if (change)
		    ptr.journal.stopRecJournal ();
		  break;
		  case 1:
		  ptr.journal.startRecJournal ();
		  break;
		  case 2:
		  doPlayJournal ();
		  break;
		  case 3:
		  ptr.journal.toLastJournal ();
		  break;
		  case 4:
		  ptr.journal.clearJournal ();
		  break;
		  case 5:
		  ptr.journal.clearLast ();
		  break;
		  case 6:
		  document.journalOptionMenu.speed.value = ptr.journal.getSpeed ();
		  ptr.journalOptionMenu.show ();
		  break;
		}

	  };

	  ptr.menuBar.addList ("journal", "Journal", ["Journal Off", "Journal On",
						      "Play Journal", "To Last J",
						      "Clear All Js",
						      "Clear Last J",
						      "Options"],
                               function () {
			         journalCB (this.selectedIndex, true);
		               }, function () {
			            journalCB (this.selectedIndex, false);
		                  });
	}

	if (mode.menuBarShow && mode.menuBarShow.find) {
	  var input = ptr.menuBar.addButton ("text", "find", "", null, function (ev) {
			ev = ev || window.event;
			ptr.extractBounce (document.menuBar.find.value);
		      });

	  ptr.menuBar.addList ("extractAction", "ExtractAction",
			       ["Hide others", "Select",
				"Show focused", "Show active", "Center to first",
                                "Center to last", "Center to random"],
			       function () {
				 ptr.extractAction = this.selectedIndex;
			       });
	}

	// document.menuBar.mode [0].checked = true;
	ptr.menuBar.show ();
      };

      var addSendMenu = function () {
	ptr.sendMenu = new PimForm ("sendMenu", "", "", false, [10,43], "1");
	ptr.sendMenu.addButton ("button", "send", "Send", function () {
	  var pm_name = $getCookie ("pi-mind-store-id");
	  pm_name = pm_name.slice (1,-1);
	  $.ajax({
	    type: 'POST',
	    url: pm_name,
	    data: {pi_mind: exportMind ()},
	    success: function (response, state, ajax) {
	      alert ("Your version is at:\n" + response.rev);
	    },
	    dataType: 'json'
	  });
	});
	ptr.sendMenu.show ();
      };

      var addAttrEditMenu = function () {
	var shift = $getCookie ("pi-mind-store-id") && mode.sendButton
		  ? 75 : 0;
	var uberDiv = ptr.menuAttrsDiv = $createHTMLElement ("div");
	var div = $createHTMLElement ("div");
	var yPos = $selectElements ('.menu-bar')[0];

	yPos = yPos.offsetTop;

	$position (div, shift + 10, yPos + 30);
	div.style.zIndex = "1";

	$addNode (document.body, uberDiv);
	$addNode (uberDiv, div);

	var attrs = [];
	var dictAttrs = {};
	var levAttrs = PimBuoy.prototype.levelAttrs;

	for (var i = 0; i < levAttrs.length; i++) {
	  if (levAttrs [i].icon && levAttrs [i].type !== "text") {
	    attrs.push (['<img src="' + levAttrs [i].icon + '"/>',
			 levAttrs [i].name]);
	    dictAttrs [levAttrs [i].name] = levAttrs [i];
	  }
	}

	var activeLevels = function () {
	  return $fold ($selectElements ("input", ptr.levelsEditor),
			function (el, id, res) {
	    if (el.checked)
	      res.push (id);
			  return res;
			}, []);
	};

	var q_mark = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A\
/wD/oL2nkwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB90EFg8oMnxQs8UAAAPGSURBVFjD\
1ZZ/TJVVGMc/573AjR+ykZK0xDazYBjejIo1tGxMg+EsrIlya+MPM9cvZ+sPJmzlVpTV2hxbTGYB\
6U1Am7axVQrLXNhPKnKzpkvWsmkLC7lwuVfueU5/8N55u3ov3Auj9d3Ozvu+53ue5/s+z3Oe91VM\
ETWHTtNaeRvFjd/MX1GQU5k7L2NJqjMpIxgUGfJdPvfjwMXe9qr8I8QJNVXiA7v7clcvW/i+pVju\
9Y8zOOw3gXGtHJZiTloy2ZmppDgs+eXCcF1TxaLXHv/gZ/Y+kj8zAtwHTq13LcruOPP7kBkLBJVS\
194W1ELegixG/OP9b5YuvMPdeQrP+oLpCVjb9n1pcd6N3ScHBo3DoRRgwvadB+YByaHnBsjJSmfs\
crC7qWLxqmlH4IXugcC5wZFk9W/uc/s3FDaGbja2n7wHOAJkAkqM4aa5GZy9MLTcmeTo7ah2RbVv\
xXL+cFvfE/5AMMWIKBHBHjvDndv4WkQKxeZhDJdGAybdmfxkLOeTCshITS6/6PUZLZrQ6Kh21Uby\
9m8opKPa9ZsWfSbEGxrxqSSHun2yCCfFWhwLjKcbY0K3Btgbiy9aUsIT5fX5zWQCokbg0X0/oHWw\
XkQrEY09161779uruDlbdvFQy1clYvTNNhcRbUR037SLcO27X2QB9xtjepxOp/fgY0VXcdbs6V1s\
WdZPgCPC5i2WZZ09XFM8/UYUDRXNn9+LxQnAKCYahMGgUK92bSrZnnAKpoKy3Z9VCnJCRIyIqFAB\
ikhL16aS7Wv29M5cK47E6qZPKxSqCyZe98qLs/OTLStry5uP89Hm+2ZeQGnjUTBmjuVwDId1xdD8\
1NGnS5visRd3CnqeXYVRvGg3JSUi6Il5Y7zOJ+0DUc+7SHnEo/ZjW8vaE7FlJShgflhrRkTeWbnr\
Y2ZTwHm78hHRgKPn2Nay2RGw4q0uRHSViP5Vix4VkWeOb3vQMJsofuND/jMUvdIJwF0NB2rvbjjY\
XNTQWT4dewk1ojtf7uhXqKVX/oJMzXf1VW2zUgOuHZ4FRmRp2BfSGJHnE41A/H3A4NVGIkPnTVRA\
3BHof8l9SUQ3h/0lKS16m2tH+2yV4dsAFNS3Limob12XX9eSFlrxeDwzU4Qejwe3202UtVhRk2j7\
4j4FHo8nC8gDcoEbgLmAE8iOkbpR4C/AD/wJ/AEMAKfdbncw3iJcBmwGbgWuBzJsvgNIuYZ4DQTs\
ozkGjNgCvgReBwbjjYACrgPS7ZFpO0+zryMxDvwNiB0Jny3CZ68RV3oSKaj/Jf4BKUrUr02HHOQA\
AAAASUVORK5CYII=";

	var hideInputs = function () {
	  $each ($selectElements ("input", ptr.attrEditors),
		 function (el) { $hide (el); });
	};

	ptr.menuAttrs = new PimMenu (attrs,
				     "<img src='" + q_mark + "' />", div,
				     emptyF,
				     function () {
				       var selected = ptr.menuAttrs.getSelectedValue ();

				       hideInputs ();

				       var els = $selectElements ('input[type="'
								 + dictAttrs [selected].type
								 + '"]', ptr.attrEditors);

				       var n = dictAttrs [selected].lname.length;
				       var alevs = activeLevels ();
				       var val;

				       if (ptr.selectedBuoys.length
					 && alevs.length) {
					 val = ptr.selectedBuoys[0].getStateAttr (alevs [0], selected);
				       }

				       for (var i = 0; i < n; i ++) {
					 if (dictAttrs [selected].typeAttrs)
					   $setAttrs (els [i], dictAttrs [selected].typeAttrs);

					 if (val) {
					   if (n > 1)
					     els [i].value = val [i];
					   else
					     els [i].value = val;
					 }
					 $show (els [i]);
				       }
				     });

	var editors = "<form class='attr-editors'>"
		    + "<input type='range' />"
		    + "<input type='range' />"
		    + "<input type='color' />"
		    + "</form>";

	var e_div = ptr.attrEditors = $createHTMLElement ("div");

	e_div.style.zIndex = "1";
	e_div.innerHTML = editors;
	$position (e_div, shift + 200, yPos + 60);
	$addNode (uberDiv, e_div);

	$each ($selectElements ("input", e_div),
	       function (el) {
		 $addEventHandler (el, "change",
				   function () {
				     var alevs = activeLevels ();
				     if (!alevs.length)
				       return;

				     var selected = ptr.menuAttrs.getSelectedValue ();
				     var els = $selectElements ('input[type="'
							       + dictAttrs [selected].type
							       + '"]', ptr.attrEditors);
				     var n = dictAttrs [selected].lname.length;

				     $each (ptr.selectedBuoys,
					    function (b) {
					      var vals = getBuoyAttrLevelVals (b, selected);
					      $each (alevs,
						     function (l) {
						       var val = [];

						       $each (els,
							      function (el)
							      { val.push (el.value); });

						       if (n > 1)
							 vals [l] = val;
						       else
							 vals [l] = val [0];
						     });

					      buoyState (b, alevs [0]);
					      setBuoyAttrLevelVals (b, selected, vals);
					    });
				   });
	       });

	var levels = "<form name='levelsEditor' class='levels'>"
		   + "<input type='checkbox' name='l1' value='l1'>Pasive<br>"
		   + "<input type='checkbox' name='l2' value='l2'>Focused<br>"
		   + "<input type='checkbox' name='l2' value='l2'>Active"
		   + "</form>";

	var l_div = ptr.levelsEditor = $createHTMLElement ("div");
	l_div.style.zIndex = "1";
	l_div.innerHTML = levels;
	$position (l_div, shift + 100, yPos + 40);
	$addNode (uberDiv, l_div);

	hideInputs ();
	$hide (uberDiv);
      };

      var addJournalOptionMenu = function () {
	var useGlobalChecked = function () {
	  if (ptr.journal.getUseGlobal ())
	    return "checked='checked'";
	  else
	    return "";
	};

	ptr.journalOptionMenu = new PimForm ("journalOptionMenu",
					     "<table>"
				+ "<tr>"
				+ "<td>Speed Factor:</td>"
				+ "<td><input type='text' name='speed' value='"+ ptr.journal.getSpeed () +"' size=4 /></td>"
				+ "</tr>"
				+ "<tr>"
				+ "<td>Use As Global:</td>"
				+ "<td><input type='checkbox' name='useGlobal' "
				+	 useGlobalChecked ()
				+ "/></td>"
				+ "</tr>"
				+ "</table>",
					     "Set", true, [640, 10], "1");
	ptr.journalOptionMenu.addModeHandlers ('journal-options', {
	  'submit': function () {
	    ptr.journal.setSpeed (parseFloat (document.journalOptionMenu.speed.value));
	    ptr.journal.setUseGlobal (document.journalOptionMenu.useGlobal.checked);
	  }
	});
	ptr.journalOptionMenu.setMode ('journal-options');
	ptr.journalOptionMenu.hide ();
      };

      var makeFnWrapper = function (fn, convertFn) {
	return function () {
	  var args = Array.prototype.slice.call(arguments);
	  var id = args.shift ();

	  return fn.apply (this,
			   [convertFn (id)].concat (args));
	};
      };

      var makeBuoyFnWrapper = function (fn) {
	return makeFnWrapper (fn, ptr.mind.getWhileFromArchive.bind (ptr.mind));
      };

      var makeAssocFnWrapper = function (fn) {
	return makeFnWrapper (fn, ptr.mind.getAssociationFromArchive.bind (ptr.mind));
      };

      var initJournal = function () {
	ptr.journal = new PimJournalLogger (mind);
	ptr.journal.setPlayHooks (
	  {
	    'buoyState1': makeBuoyFnWrapper (buoyState1),
	    'buoyFixed' : makeBuoyFnWrapper (buoyFixed),
	    'buoyState0': makeBuoyFnWrapper (buoyState0),
	    'buoyState2': makeBuoyFnWrapper (buoyState2),
	    'buoySelect': makeBuoyFnWrapper (buoySelect),
	    'buoyMove'  : makeBuoyFnWrapper (buoyMove),
	    'buoyScroll': makeBuoyFnWrapper (buoyScroll),
	    'assocShowBuoy': makeAssocFnWrapper (assocShowBuoy),
	    'canvasMove': canvasMove,
	    'canvasZoom': canvasZoom,
	    'buoyNew'   : buoyNew,
	    'buoyUpdate': makeBuoyFnWrapper (buoyUpdate),
	    'assocNew'  : assocNew,
	    'assocUpdate': makeAssocFnWrapper (assocUpdate),
	    'removeBuoy' : makeBuoyFnWrapper (removeBuoy),
            'removeAssoc': makeAssocFnWrapper (removeAssoc),
	    'buoyVisibility': makeBuoyFnWrapper (buoyVisibility),
	    'buoyPich': makeBuoyFnWrapper (buoyPitch),
	    'assocMoveToBuoy': makeAssocFnWrapper (assocMoveToBuoy),
            'centerViewToBuoy': makeBuoyFnWrapper (centerViewToBuoy)
	  }
	);
      };

      this.init = function () {
	if ($definedNonNull (mind)) {
	  initJournal ();
	  this.mindObserverEl = createObserver (elObserver);
	  if (typeof (mode.initMode) !== 'undefined') {
	    this.mode = mode.initMode;
	    if (this.mode === 2)
	      this.mindObserverEl.style.display = "inline";
	  }

	  mind.addModeHandlers ('default', {
	    'whileCreated': addWhileHandlers,
	    'associationCreated': addAssocHandlers
	  });
	  mind.setMode ('default');
	  if (mode.edit || mode.canvasMove)
	    addCanvasHandlers ();
	  if (mode.edit) {
	    addNewBuoyForm ();
	    addNewAssocForm ();
	  }
	  if (mode.menuBar) {
	    addImportForm ();
	    addExportForm ();
	    addMenuBar ();
	    addAttrEditMenu ();
	  }
	  if ($getCookie ("pi-mind-store-id") && mode.sendButton)
	    addSendMenu ();
	  addJournalOptionMenu ();
	}
      };

      this.toJSON = function (selection) {
	var data = mind.toJSON (selection);
	data.journal = this.journal.toJSON ();

	return data;
      };

      this.fromJSON = function (data, onlyJournal) {
	if (!onlyJournal)
	  mind.fromJSON (data);
	if (data.journal)
	  this.journal.fromJSON (data.journal);
      };

      this.playJournal = function () {
	this.journal.startPlayJournal ();
      };

      var isInMap = function (map, r) {
        return $foldMap (map, function (data, _, v) {
		 return v
			|| (data && data.search (r) !== -1)
			|| (!data && "".search (r) !== -1);
	       }, false);
      };

      var canUpdateSelectedBuoy = function (centerBuoy) {
        var jump = Math.floor (10 *  Math.random ()) + 1;
        return ((!centerBuoy && ptr.extractAction === 4)
              || (ptr.extractAction === 5)
              || ((ptr.extractAction === 6) && (!centerBuoy || !Math.floor (jump * Math.random ()))));
      };

      this.extractBounce = function (str) {
	var me = this;
	if (this._extractTimeoutId) {
	  window.clearTimeout (this._extractTimeoutId);
	}
	this._extractTimeoutId = window.setTimeout (function () {
	  me._extractTimeoutId = null;
	  me.extract (str);
	}, 500);
      };

      this.extract = function (str) {
        var pos;
        var txt = (ptr.extractAction < 4)
                ? str
                : (pos = str.indexOf ('@@@'),
                   pos === -1 ? str : str.substr (0, pos));
	var r = new RegExp (txt);
        var r1 = pos !== -1 ? new RegExp (str.substr (pos + 3)) : null;
        var centerBuoy = [null, null];

	mind.filterMind (
	  function (b, idx) {
	    var data = b.getDatas ();
	    var inSet = isInMap (data, r);

	    switch (ptr.extractAction) {
	      case 0:
              case 4:
              case 5:
              case 6:
	      buoyVisibility (b, inSet);

              if (ptr.extractAction >= 4) {
                if (inSet && txt) {
                  if (r1) {
                    if (canUpdateSelectedBuoy (centerBuoy [0]) && isInMap (data, r1)) {
                      centerBuoy[0] = b;
                    }
                  } else {
                    if (canUpdateSelectedBuoy (centerBuoy [1])) {
                      centerBuoy [1] = b;
                    }
                  }
                }
              }
	      break;
	      case 1:
	      if (inSet && str &&
		  (ptr.selectedBuoys.indexOf (b) === -1))
		buoySelect (b);
	      else if ((!(inSet && str))
		     && ptr.selectedBuoys.indexOf (b) !== -1)
		buoySelect (b);
	      break;
	      case 2:
	      if (inSet && str)
		buoyState1 (b);
	      else
		buoyState0 (b);
	      break;
	      case 3:
	      if (inSet && str)
		buoyState2 (b);
	      else
		buoyState0 (b);
	      break;
	      default:
	      break;
	    };
	  },
	  function (a, idx) {
	    var bs = a.getBuoys ();
	    assocVisibility (a, !(bs [0].isHidden () || bs [1].isHidden ()));
	  });

        if (ptr.extractAction >= 4
          && (centerBuoy[0] || centerBuoy[1])) {
          centerViewToBuoy (centerBuoy[0] || centerBuoy[1]);
        }
      };

      this.init ();
    }
  });

  /// PimSaver
  window.PimSaver = function (content) {
    if ($definedNonNull (document.saveForm)) {
      document.saveForm.content.value = content.toString ();
    } else {
      var sForm = new PimForm ("saveForm", "<input type='hidden' "
                                           + "name='content' value='"
				         + content.toString ()
				         + "' />", "", false);
    }
  };

  PimSaver.prototype.saveByURI = function (json) {
    var newContent;
    var replString = 'input type="hidden"'
                   + ' name="content" value="';
    var regExp = new RegExp ('input type="hidden"'
                            + ' name="content" value=".*?"');

    if (PimInitHTML.match (regExp)) {
      newContent = PimInitHTML.replace (regExp,
                                        replString
                                               + encodeURIComponent(json) + '"');
    } else {
      var replaceStr = '<div class="Form" style="display:none">'
                     + '<form name="saveForm">'
                     + '<input type="hidden" '
                     + 'name="content" value="'
                     + encodeURIComponent (json) + '" />'
                     + '</form></div>\n</bo'
		     + 'dy>\n';
      regExp = new RegExp ("</bo"
			   + "dy>");
      newContent = PimInitHTML.replace (regExp, replaceStr);
    }

    if (document.doctype) {
      var docType = "<!DOCTYPE ";

      if (document.doctype.name) {
        docType += document.doctype.name;
      }

      if (document.doctype.publicId) {
        docType += ' PUBLIC "' + document.doctype.publicId + '"';
      }

      if (document.doctype.systemId) {
        docType += ' "' + document.doctype.systemId + '"';
      }

      docType += ">\n";
      newContent = docType + newContent;
    }

    // Get the current filename
    var filename = "pi-mind.html",
    p = document.location.pathname.lastIndexOf("/");
    if (p !== -1) {
      filename = document.location.pathname.substr (p + 1);
    }
    // Set up the link
    var link = document.createElement ("a");
    link.setAttribute ("target","_blank");
    if (Blob !== undefined) {
      var blob = new Blob ([newContent], {type: "text/html"});
      link.setAttribute("href", URL.createObjectURL(blob));
    } else {
      link.setAttribute("href","data:text/html," + encodeURIComponent(newContent));
    }
    link.setAttribute ("download", filename);
    document.body.appendChild (link);
    link.click ();
    document.body.removeChild (link);
  };

  /// helper function: returns function that determine center of
  /// expansion of buoy
  var getCenterPosFn = function (type) {
    var f = null;
    type = type || 0;

    switch (type) {
      case 0:
      f = function (w, h) {
	return [w/2,h/2];
      };
      break;
      case 1:
      f = function (w, h) {
	return [0,0];
      };
      break;
      case 2:
      f = function (w, h) {
	return [w,h];
      };
      case 3:
      f = function (w, h) {
	return [w,0];
      };
      case 4:
      f = function (w, h) {
	return [0,h];
      };
    }

    return f;
  };

  var makePitch = function (params, elName) {
    var datas = window/*.opener*/.PimContentToSave;
    var did = parseInt (params [0]);
    var showNameAttr = params[1];

    $getElementById (elName).style.display = "none";

    $each (datas,
	   function (textData) {
             var div;
	     var hr = $createHTMLElement ("hr");
             $addNode (document.body, hr);

             if (showNameAttr) {
               div = $createHTMLElement ("div");
               div.innerHTML = textData[0];
               $addNode (document.body, div);
             }

	     div = $createHTMLElement ("div");
	     div.innerHTML = textData[1];

	     $addNode (document.body, div);
	   });
  };

  /// PimCreateInfrastruct

  /*
   * elName - can be any html element where to insert canvas with pi-mind
   *	       default is 'mind'
   * width - if zero it is browser window width
   * height - if zero it is browser window height
   * mode - 'edit' you can do averything with pi-mind
   *	     'read' you can manipulate with units
   *	     'fixed' you can just read units
   *	     or
   *	     dictionary with enabled features like 'edit', 'buoyMove', 'canvasMove', 'canvasZoom', 'menuBar', 'buoyScroll', 'sendButton', 'journal'
   *	     'initMode' set to 0 (standard mode ala edit) or 2 (observe mode),
   *	     'centerPos': buoy expands from 0 - center, 1 - top left, 2 - bottom right, 3 - top right, 4 - bottom left
   *	     ex: {buoyMove: true, canvasMove:true, buoyScroll: true} is read mode
   *	     default 'edit'
   * elObserver - any html element where to insert observer buoy content default is 'mindObserver'
   */
  window.PimCreateInfrastruct = function (elName, width, height, mode, elObserver) {
    var messageHandler;
    if (window.opener) {
      messageHandler = function (event) {
        var response = JSON.parse (event.data);

        console.log ('data received', response);

        window.PimContentToSave = response;
        window.PimCreateInfrastruct_ (elName, width, height, mode, elObserver);
      };

      window.addEventListener ("message", messageHandler, false);
      window.opener.postMessage('send-data', '*');
    } else {
      messageHandler = function (event) {
        window.PimContentToSaveSender (event);
      };

      window.addEventListener ("message", messageHandler, false);

      window.PimCreateInfrastruct_ (elName, width, height, mode, elObserver);
    }
  };

  window.PimCreateInfrastruct_ = function (elName, width, height, mode, elObserver) {
    var st = $getElementById ('saveText');

    window.PimInitHTML = document.documentElement.outerHTML;

    if (window.location.hash === '#save') {
      PimSaver (window/*.opener*/.PimContentToSave);
      if (!$definedNonNull (st)) {
	var div = $createHTMLElement ("div");
	$setAttrs (div, {id: "saveText"});
	div.innerHTML = "<p>Your browser do not support automatic saving. Please save this page (not original one) manualy by using 'Save as' ability of your browser.</p>";
	div.style.zIndex = "1";
	div.style.position = "absolute";
	div.style.border = "2px solid red";
	div.style.left = "0px";
	div.style.top = "0px";
	$addNode (document.body, div);
      } else {
	st.style.display = "inline";
      }
    } else {
      if ($definedNonNull (st))
	st.style.display = "none";
    }

    elName = elName || "mind";

    // let browser time to initialize everything after loading
    window.setTimeout (function () {
      var journalP = (window.location.hash === '#journal')
		  || (typeof (mode) === 'object' && mode.journal);

      if (window.location.hash.substring (0, 6) === "#pitch") {
        var params = window.location.hash.substring (7).split ('&');
	makePitch (params, elName);
      } else if (window.location.hash !== '#save') {
	if (journalP && window.opener && window/*.opener*/.PimContentToSave)
	  PimSaver (window/*.opener*/.PimContentToSave);

	var c = new PimCanvas (elName, 0, 0, width, height);
	var v = new PimDataView (c, {centerPosFn: getCenterPosFn (mode ? mode.centerPos : 0)});
	v.setDataModel (new PimDataModel ());

	var hm = new PimHerbartMindModel (v);
	var hmv = new PimHerbartMindModelOperator (hm, mode || 'edit',
						   elObserver || 'mindObserver');

	if ($definedNonNull (document.saveForm)) {
          var json;

          if (document.saveForm.content.value[0] !== '{') {
            try {
              json = decodeURIComponent (document.saveForm.content.value);
            } catch (x) {
              json = document.saveForm.content.value;
            }
          } else {
            json = document.saveForm.content.value;
          }

	  hmv.fromJSON (JSON.parse (json), journalP);

          // force script runing
          var whiles = hm.getWhileArchive ();
          for (var wi in whiles) {
            var b = whiles [wi];
            var s = b.getCurrentState ();
	    b.setCurrentState (null);
	    b.setCurrentState (s, {operator: hmv, mind: hm});
          }
	}

	if (window.location.hash.substring (0, 8) === "#extract"
            || (mode.extract && mode.extract !== '')) {
          var extractString = window.location.hash.substring (0, 8) === "#extract" ? window.location.hash.substring (9) : mode.extract;
	  hmv.extract (extractString);
	}

	if (journalP) {
	  hmv.playJournal ();
	}

        updateMath ();
      }
    }, 200);
  };

  // hack because of Chrome XSS policy and pi-mind store
  window.__pImCi__ = PimCreateInfrastruct;

}) ();
