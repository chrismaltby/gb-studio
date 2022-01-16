/*	SWFObject v2.2 <http://code.google.com/p/swfobject/>
				is released under the MIT License <http://www.opensource.org/licenses/mit-license.php>
*/
let swfobject = function () {
	let D = 'undefined', r = 'object', S = 'Shockwave Flash', W = 'ShockwaveFlash.ShockwaveFlash',
		q = 'application/x-shockwave-flash', R = 'SWFObjectExprInst', x = 'onreadystatechange',
		O = window, j = document, t = navigator, T = false, U = [h], o = [], N = [], I = [], l, Q, E,
		B, J = false, a = false, n, G, m = true, M = function () {
			let aa = typeof j.getElementById != D && typeof j.getElementsByTagName != D &&
				typeof j.createElement != D,
				ah = t.userAgent.toLowerCase(), Y = t.platform.toLowerCase(),
				ae = Y ? /win/.test(Y) : /win/.test(ah), ac = Y ? /mac/.test(Y) : /mac/.test(ah),
				af = /webkit/.test(ah) ? parseFloat(ah.replace(/^.*webkit\/(\d+(\.\d+)?).*$/, '$1')) :
					false,
				X = !+'\v1', ag = [0, 0, 0], ab = null;
			if (typeof t.plugins != D && typeof t.plugins[S] == r) {
				ab = t.plugins[S].description;
				if (ab && !(typeof t.mimeTypes != D && t.mimeTypes[q] && !t.mimeTypes[q].enabledPlugin)) {
					T = true;
					X = false;
					ab = ab.replace(/^.*\s+(\S+\s+\S+$)/, '$1');
					ag[0] = parseInt(ab.replace(/^(.*)\..*$/, '$1'), 10);
					ag[1] = parseInt(ab.replace(/^.*\.(.*)\s.*$/, '$1'), 10);
					ag[2] = /[a-zA-Z]/.test(ab) ? parseInt(ab.replace(/^.*[a-zA-Z]+(.*)$/, '$1'), 10) : 0
				}
			} else {
				if (typeof O.ActiveXObject != D) {
					try {
						let ad = new ActiveXObject(W);
						if (ad) {
							ab = ad.GetVariable('$version');
							if (ab) {
								X = true;
								ab = ab.split(' ')[1].split(',');
								ag = [parseInt(ab[0], 10), parseInt(ab[1], 10), parseInt(ab[2], 10)]
							}
						}
					} catch (Z) {
					}
				}
			}
			return {
				w3: aa, pv: ag, wk: af, ie: X, win: ae, mac: ac
			}
		}(), k = function () {
			if (!M.w3) {
				return
			}
			if ((typeof j.readyState != D && j.readyState == 'complete') ||
				(typeof j.readyState == D && (j.getElementsByTagName('body')[0] || j.body))) {
				f()
			}
			if (!J) {
				if (typeof j.addEventListener != D) {
					j.addEventListener('DOMContentLoaded', f, false)
				}
				if (M.ie && M.win) {
					j.attachEvent(x, function () {
						if (j.readyState == 'complete') {
							j.detachEvent(x, arguments.callee);
							f()
						}
					});
					if (O == top) {
						(function () {
							if (J) {
								return
							}
							try {
								j.documentElement.doScroll('left')
							} catch (X) {
								setTimeout(arguments.callee, 0);
								return
							}
							f()
						})()
					}
				}
				if (M.wk) {
					(function () {
						if (J) {
							return
						}
						if (!/loaded|complete/.test(j.readyState)) {
							setTimeout(arguments.callee, 0);
							return
						}
						f()
					})()
				}
				s(f)
			}
		}();
	function f() {
		if (J) {
			return
		}
		try {
			let Z = j.getElementsByTagName('body')[0].appendChild(C('span'));
			Z.parentNode.removeChild(Z)
		} catch (aa) {
			return
		}
		J = true;
		let X = U.length;
		for (let Y = 0; Y < X; Y++) {
			U[Y]()
		}
	}
	function K(X) {
		if (J) {
			X()
		} else {
			U[U.length] = X
		}
	}
	function s(Y) {
		if (typeof O.addEventListener != D) {
			O.addEventListener('load', Y, false)
		} else {
			if (typeof j.addEventListener != D) {
				j.addEventListener('load', Y, false)
			} else {
				if (typeof O.attachEvent != D) {
					i(O, 'onload', Y)
				} else {
					if (typeof O.onload == 'function') {
						let X = O.onload;
						O.onload = function () {
							X();
							Y()
						}
					} else {
						O.onload = Y
					}
				}
			}
		}
	}
	function h() {
		if (T) {
			V()
		} else {
			H()
		}
	}
	function V() {
		let X = j.getElementsByTagName('body')[0];
		let aa = C(r);
		aa.setAttribute('type', q);
		let Z = X.appendChild(aa);
		if (Z) {
			let Y = 0;
			(function () {
				if (typeof Z.GetVariable != D) {
					let ab = Z.GetVariable('$version');
					if (ab) {
						ab = ab.split(' ')[1].split(',');
						M.pv = [parseInt(ab[0], 10), parseInt(ab[1], 10), parseInt(ab[2], 10)]
					}
				} else {
					if (Y < 10) {
						Y++;
						setTimeout(arguments.callee, 10);
						return
					}
				}
				X.removeChild(aa);
				Z = null;
				H()
			})()
		} else {
			H()
		}
	}
	function H() {
		let ag = o.length;
		if (ag > 0) {
			for (let af = 0; af < ag; af++) {
				let Y = o[af].id;
				let ab = o[af].callbackFn;
				let aa = { success: false, id: Y };
				if (M.pv[0] > 0) {
					let ae = c(Y);
					if (ae) {
						if (F(o[af].swfVersion) && !(M.wk && M.wk < 312)) {
							w(Y, true);
							if (ab) {
								aa.success = true;
								aa.ref = z(Y);
								ab(aa)
							}
						} else {
							if (o[af].expressInstall && A()) {
								let ai = {};
								ai.data = o[af].expressInstall;
								ai.width = ae.getAttribute('width') || '0';
								ai.height = ae.getAttribute('height') || '0';
								if (ae.getAttribute('class')) {
									ai.styleclass = ae.getAttribute('class')
								}
								if (ae.getAttribute('align')) {
									ai.align = ae.getAttribute('align')
								}
								let ah = {};
								let X = ae.getElementsByTagName('param');
								let ac = X.length;
								for (let ad = 0; ad < ac; ad++) {
									if (X[ad].getAttribute('name').toLowerCase() != 'movie') {
										ah[X[ad].getAttribute('name')] = X[ad].getAttribute('value')
									}
								}
								P(ai, ah, Y, ab)
							} else {
								p(ae);
								if (ab) {
									ab(aa)
								}
							}
						}
					}
				} else {
					w(Y, true);
					if (ab) {
						let Z = z(Y);
						if (Z && typeof Z.SetVariable != D) {
							aa.success = true;
							aa.ref = Z
						}
						ab(aa)
					}
				}
			}
		}
	}
	function z(aa) {
		let X = null;
		let Y = c(aa);
		if (Y && Y.nodeName == 'OBJECT') {
			if (typeof Y.SetVariable != D) {
				X = Y
			} else {
				let Z = Y.getElementsByTagName(r)[0];
				if (Z) {
					X = Z
				}
			}
		}
		return X
	}
	function A() {
		return !a && F('6.0.65') && (M.win || M.mac) && !(M.wk && M.wk < 312)
	}
	function P(aa, ab, X, Z) {
		a = true;
		E = Z || null;
		B = { success: false, id: X };
		let ae = c(X);
		if (ae) {
			if (ae.nodeName == 'OBJECT') {
				l = g(ae);
				Q = null
			} else {
				l = ae;
				Q = X
			}
			aa.id = R;
			if (typeof aa.width == D || (!/%$/.test(aa.width) && parseInt(aa.width, 10) < 310)) {
				aa.width = '310'
			}
			if (typeof aa.height == D || (!/%$/.test(aa.height) && parseInt(aa.height, 10) < 137)) {
				aa.height = '137'
			}
			j.title = j.title.slice(0, 47) + ' - Flash Player Installation';
			var ad = M.ie && M.win ? 'ActiveX' : 'PlugIn',
				ac = 'MMredirectURL=' + O.location.toString().replace(/&/g, '%26') +
					'&MMplayerType=' + ad + '&MMdoctitle=' + j.title;
			if (typeof ab.flashvars != D) {
				ab.flashvars += '&' + ac
			} else {
				ab.flashvars = ac
			}
			if (M.ie && M.win && ae.readyState != 4) {
				let Y = C('div');
				X += 'SWFObjectNew';
				Y.setAttribute('id', X);
				ae.parentNode.insertBefore(Y, ae);
				ae.style.display = 'none';
				(function () {
					if (ae.readyState == 4) {
						ae.parentNode.removeChild(ae)
					} else {
						setTimeout(arguments.callee, 10)
					}
				})()
			}
			u(aa, ab, X)
		}
	}
	function p(Y) {
		if (M.ie && M.win && Y.readyState != 4) {
			let X = C('div');
			Y.parentNode.insertBefore(X, Y);
			X.parentNode.replaceChild(g(Y), X);
			Y.style.display = 'none';
			(function () {
				if (Y.readyState == 4) {
					Y.parentNode.removeChild(Y)
				} else {
					setTimeout(arguments.callee, 10)
				}
			})()
		} else {
			Y.parentNode.replaceChild(g(Y), Y)
		}
	}
	function g(ab) {
		let aa = C('div');
		if (M.win && M.ie) {
			aa.innerHTML = ab.innerHTML
		} else {
			let Y = ab.getElementsByTagName(r)[0];
			if (Y) {
				let ad = Y.childNodes;
				if (ad) {
					let X = ad.length;
					for (let Z = 0; Z < X; Z++) {
						if (!(ad[Z].nodeType == 1 && ad[Z].nodeName == 'PARAM') && !(ad[Z].nodeType == 8)) {
							aa.appendChild(ad[Z].cloneNode(true))
						}
					}
				}
			}
		}
		return aa
	}
	function u(ai, ag, Y) {
		var X, aa = c(Y);
		if (M.wk && M.wk < 312) {
			return X
		}
		if (aa) {
			if (typeof ai.id == D) {
				ai.id = Y
			}
			if (M.ie && M.win) {
				let ah = '';
				for (let ae in ai) {
					if (ai[ae] != Object.prototype[ae]) {
						if (ae.toLowerCase() == 'data') {
							ag.movie = ai[ae]
						} else {
							if (ae.toLowerCase() == 'styleclass') {
								ah += ' class="' + ai[ae] + '"'
							} else {
								if (ae.toLowerCase() != 'classid') {
									ah += ' ' + ae + '="' + ai[ae] + '"'
								}
							}
						}
					}
				}
				let af = '';
				for (let ad in ag) {
					if (ag[ad] != Object.prototype[ad]) {
						af += '<param name="' + ad + '" value="' + ag[ad] + '" />'
					}
				}
				aa.outerHTML = '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"' + ah + '>' +
					af + '</object>';
				N[N.length] = ai.id;
				X = c(ai.id)
			} else {
				let Z = C(r);
				Z.setAttribute('type', q);
				for (let ac in ai) {
					if (ai[ac] != Object.prototype[ac]) {
						if (ac.toLowerCase() == 'styleclass') {
							Z.setAttribute('class', ai[ac])
						} else {
							if (ac.toLowerCase() != 'classid') {
								Z.setAttribute(ac, ai[ac])
							}
						}
					}
				}
				for (let ab in ag) {
					if (ag[ab] != Object.prototype[ab] && ab.toLowerCase() != 'movie') {
						e(Z, ab, ag[ab])
					}
				}
				aa.parentNode.replaceChild(Z, aa);
				X = Z
			}
		}
		return X
	}
	function e(Z, X, Y) {
		let aa = C('param');
		aa.setAttribute('name', X);
		aa.setAttribute('value', Y);
		Z.appendChild(aa)
	}
	function y(Y) {
		let X = c(Y);
		if (X && X.nodeName == 'OBJECT') {
			if (M.ie && M.win) {
				X.style.display = 'none';
				(function () {
					if (X.readyState == 4) {
						b(Y)
					} else {
						setTimeout(arguments.callee, 10)
					}
				})()
			} else {
				X.parentNode.removeChild(X)
			}
		}
	}
	function b(Z) {
		let Y = c(Z);
		if (Y) {
			for (let X in Y) {
				if (typeof Y[X] == 'function') {
					Y[X] = null
				}
			}
			Y.parentNode.removeChild(Y)
		}
	}
	function c(Z) {
		let X = null;
		try {
			X = j.getElementById(Z)
		} catch (Y) {
		}
		return X
	}
	function C(X) {
		return j.createElement(X)
	}
	function i(Z, X, Y) {
		Z.attachEvent(X, Y);
		I[I.length] = [Z, X, Y]
	}
	function F(Z) {
		var Y = M.pv, X = Z.split('.');
		X[0] = parseInt(X[0], 10);
		X[1] = parseInt(X[1], 10) || 0;
		X[2] = parseInt(X[2], 10) || 0;
		return (Y[0] > X[0] || (Y[0] == X[0] && Y[1] > X[1]) ||
			(Y[0] == X[0] && Y[1] == X[1] && Y[2] >= X[2])) ?
			true :
			false
	}
	function v(ac, Y, ad, ab) {
		if (M.ie && M.mac) {
			return
		}
		let aa = j.getElementsByTagName('head')[0];
		if (!aa) {
			return
		}
		let X = (ad && typeof ad == 'string') ? ad : 'screen';
		if (ab) {
			n = null;
			G = null
		}
		if (!n || G != X) {
			let Z = C('style');
			Z.setAttribute('type', 'text/css');
			Z.setAttribute('media', X);
			n = aa.appendChild(Z);
			if (M.ie && M.win && typeof j.styleSheets != D && j.styleSheets.length > 0) {
				n = j.styleSheets[j.styleSheets.length - 1]
			}
			G = X
		}
		if (M.ie && M.win) {
			if (n && typeof n.addRule == r) {
				n.addRule(ac, Y)
			}
		} else {
			if (n && typeof j.createTextNode != D) {
				n.appendChild(j.createTextNode(ac + ' {' + Y + '}'))
			}
		}
	}
	function w(Z, X) {
		if (!m) {
			return
		}
		let Y = X ? 'visible' : 'hidden';
		if (J && c(Z)) {
			c(Z).style.visibility = Y
		} else {
			v('#' + Z, 'visibility:' + Y)
		}
	}
	function L(Y) {
		let Z = /[\\\"<>\.;]/;
		let X = Z.exec(Y) != null;
		return X && typeof encodeURIComponent != D ? encodeURIComponent(Y) : Y
	}
	return {
		registerObject: function (ab, X, aa, Z) {
			if (M.w3 && ab && X) {
				let Y = {};
				Y.id = ab;
				Y.swfVersion = X;
				Y.expressInstall = aa;
				Y.callbackFn = Z;
				o[o.length] = Y;
				w(ab, false)
			} else {
				if (Z) {
					Z({ success: false, id: ab })
				}
			}
		}, getObjectById: function (X) {
			if (M.w3) {
				return z(X)
			}
		}, embedSWF: function (ab, ah, ae, ag, Y, aa, Z, ad, af, ac) {
			let X = { success: false, id: ah };
			if (M.w3 && !(M.wk && M.wk < 312) && ab && ah && ae && ag && Y) {
				w(ah, false);
				K(function () {
					ae += '';
					ag += '';
					let aj = {};
					if (af && typeof af === r) {
						for (let al in af) {
							aj[al] = af[al]
						}
					}
					aj.data = ab;
					aj.width = ae;
					aj.height = ag;
					let am = {};
					if (ad && typeof ad === r) {
						for (let ak in ad) {
							am[ak] = ad[ak]
						}
					}
					if (Z && typeof Z === r) {
						for (let ai in Z) {
							if (typeof am.flashvars != D) {
								am.flashvars += '&' + ai + '=' + Z[ai]
							} else {
								am.flashvars = ai + '=' + Z[ai]
							}
						}
					}
					if (F(Y)) {
						let an = u(aj, am, ah);
						if (aj.id == ah) {
							w(ah, true)
						}
						X.success = true;
						X.ref = an
					} else {
						if (aa && A()) {
							aj.data = aa;
							P(aj, am, ah, ac);
							return
						} else {
							w(ah, true)
						}
					}
					if (ac) {
						ac(X)
					}
				})
			} else {
				if (ac) {
					ac(X)
				}
			}
		}, switchOffAutoHideShow: function () {
			m = false
		}, ua: M, getFlashPlayerVersion: function () {
			return {
				major: M.pv[0], minor: M.pv[1], release: M.pv[2]
			}
		}, hasFlashPlayerVersion: F, createSWF: function (Z, Y, X) {
			if (M.w3) {
				return u(Z, Y, X)
			} else {
				return undefined
			}
		}, showExpressInstall: function (Z, aa, X, Y) {
			if (M.w3 && A()) {
				P(Z, aa, X, Y)
			}
		}, removeSWF: function (X) {
			if (M.w3) {
				y(X)
			}
		}, createCSS: function (aa, Z, Y, X) {
			if (M.w3) {
				v(aa, Z, Y, X)
			}
		}, addDomLoadEvent: K, addLoadEvent: s, getQueryParamValue: function (aa) {
			let Z = j.location.search || j.location.hash;
			if (Z) {
				if (/\?/.test(Z)) {
					Z = Z.split('?')[1]
				}
				if (aa == null) {
					return L(Z)
				}
				let Y = Z.split('&');
				for (let X = 0; X < Y.length; X++) {
					if (Y[X].substring(0, Y[X].indexOf('=')) == aa) {
						return L(Y[X].substring((Y[X].indexOf('=') + 1)))
					}
				}
			}
			return ''
		}, expressInstallCallback: function () {
			if (a) {
				let X = c(R);
				if (X && l) {
					X.parentNode.replaceChild(l, X);
					if (Q) {
						w(Q, true);
						if (M.ie && M.win) {
							l.style.display = 'block'
						}
					}
					if (E) {
						E(B)
					}
				}
				a = false
			}
		}
	}
}();
