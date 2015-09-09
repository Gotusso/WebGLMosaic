(function() {
	var SIZE_FACTOR = 22;
	var CYCLE_ANIMATION_TIME = 6000;
	var FLIP_ANIMATION_TIME = 3000;
	var COLOR_ANIMATION_TIME = FLIP_ANIMATION_TIME / 4;

	// Setup the scene. Build triangle variations and asign to each of 
	// them the colors for the animation
	var size = window.innerWidth / SIZE_FACTOR;

	var geometries = [
		new THREE.Shape([
			new THREE.Vector2(0, 0),
			new THREE.Vector2(size, 0),
			new THREE.Vector2(0, size),
			new THREE.Vector2(0, 0)
		]),
		new THREE.Shape([
			new THREE.Vector2(size, 0),
			new THREE.Vector2(size, size),
			new THREE.Vector2(0, size),
			new THREE.Vector2(size, 0)
		]),
		new THREE.Shape([
			new THREE.Vector2(0, 0),
			new THREE.Vector2(size, size),
			new THREE.Vector2(size, 0),
			new THREE.Vector2(0, 0)
		]),
		new THREE.Shape([
			new THREE.Vector2(0, 0),
			new THREE.Vector2(0, size),
			new THREE.Vector2(size, size),
			new THREE.Vector2(0, 0)
		]),
	];
	var axixes = [
		new THREE.Vector3(1, 1, 0).normalize(),
		new THREE.Vector3(1, 1, 0).normalize(),
		new THREE.Vector3(-1, 1, 0).normalize(),
		new THREE.Vector3(-1, 1, 0).normalize()
	];
	var makeColor = function(channel) {
		return {
			r: channel === 'r' ? 1 : Math.random() * 0.7,
			g: channel === 'g' ? 1 : Math.random() * 0.7,
			b: channel === 'b' ? 1 : Math.random() * 0.7,
		};
	};
	
	var w = 0;
	var h = 0;
	var triangles = [];
	var scene = new THREE.Scene();
	while (h < window.innerHeight) {
		while (w < window.innerWidth) {
			var geometry = geometries[triangles.length % geometries.length];
			var axis = axixes[triangles.length % geometries.length];
			var colors = [makeColor('r'), makeColor('g'), makeColor('b')];
			var pivot = new THREE.Object3D();
			var triangle = new THREE.Mesh(
				new THREE.ShapeGeometry(geometry), 
				new THREE.MeshBasicMaterial({ color: new THREE.Color(colors[0].r, colors[0].g, colors[0].b), side: THREE.DoubleSide })
			);			

			triangle.position.x = - size / 2;
			triangle.position.y = - size / 2;
			pivot.position.x = w + size / 2;
			pivot.position.y = h + size / 2;

			triangles.push({
				mesh: triangle,
				colors: colors,
				pivot: pivot,
				axis: axis
			});

			pivot.add(triangle);
			scene.add(pivot);

			if (triangles.length % 2 === 0) {
				w += size;
			}
		}

		w = 0;
		h += size;
	}

	// Setup the animation. On each frame we're going to interpolate the rotation and
	// color of each triangle with Robert Penner’s style animation functions.
	var animate = {
		inBack: function(timestamp, begin, end, total) {
			if (timestamp > total) {
				return end;
			}
			return (function(t, b, c, d, s) {
				if (s == undefined) {
					s = 1.70158;
				}
				return c*(t/=d)*t*((s+1)*t - s) + b
			})(timestamp, begin, end - begin, total);
		},
		inOutBack: function(timestamp, begin, end, total) {
			if (timestamp > total) {
				return end;
			}
			return (function(t, b, c, d, s) {
				if (s == undefined) {
					s = 1.70158;
				}
				if ((t/=d/2) < 1) {
					return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
				}
				return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b
			})(timestamp, begin, end - begin, total);
		}
	};

	var triggers = [];
	triangles.forEach(function(triangle) {
		
		var colorAnimation = function(cycle, timestamp) {
			triangle.mesh.material.color = new THREE.Color(
				animate.inBack(timestamp, triangle.colors[cycle].r, triangle.colors[(cycle + 1) % 3].r, COLOR_ANIMATION_TIME),
				animate.inBack(timestamp, triangle.colors[cycle].g, triangle.colors[(cycle + 1) % 3].g, COLOR_ANIMATION_TIME),
				animate.inBack(timestamp, triangle.colors[cycle].b, triangle.colors[(cycle + 1) % 3].b, COLOR_ANIMATION_TIME)
			);
		};
		var meshAnimation = function(cycle, timestamp) {
			triangle.pivot.quaternion.setFromAxisAngle(
				triangle.axis, 
				animate.inOutBack(timestamp, 0, Math.PI, FLIP_ANIMATION_TIME)
			);
		};

		var meshAnimationFireTime = Math.random() * (CYCLE_ANIMATION_TIME - 1000 - FLIP_ANIMATION_TIME);
		var colorAnimationFireTime = meshAnimationFireTime + FLIP_ANIMATION_TIME / 4;
		triggers.push(function(timestamp) {
			var cycle = Math.floor(timestamp / CYCLE_ANIMATION_TIME) % 3;
			var meshAnimationTimestamp = timestamp % CYCLE_ANIMATION_TIME - meshAnimationFireTime;
			var colorAnimationTimestamp = timestamp % CYCLE_ANIMATION_TIME - colorAnimationFireTime;
			
			if (meshAnimationTimestamp > 0) {
				meshAnimation(cycle, meshAnimationTimestamp);
			}
			if (colorAnimationTimestamp > 0) {
				colorAnimation(cycle, colorAnimationTimestamp);
			}
		});
	});

	// Finally setup the camera and renderer to start the animation.
	//var camera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 0, 1000 );
	var camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 1000);
	camera.position.x = window.innerWidth / 2;
	camera.position.y = window.innerHeight / 2;
	camera.position.z = window.innerWidth / (window.innerWidth / window.innerHeight);

	var glChecker = function() {
		try {
			var canvas = document.createElement('canvas');
			var ctx = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
			return !! ctx;
		}
		catch (e) {
			return false;
		}
	};

	if (glChecker()) {
		var renderer = new THREE.WebGLRenderer();
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.setClearColor(0x222222, 1);
		var render = function(timestamp) {
			requestAnimationFrame(render);
			if (timestamp) {
				triggers.forEach(function(trigger) {
					trigger(timestamp);
				});
			}

			renderer.render(scene, camera);
		};

		window.addEventListener('resize', function() {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.position.z =  window.innerWidth / (window.innerWidth / window.innerHeight);
			camera.updateProjectionMatrix();
			renderer.setSize(window.innerWidth, window.innerHeight);
		}, false);

		document.body.appendChild(renderer.domElement);
		render();
	}
	else {
		var node = document.createTextNode('Sorry, your browser doesn\'t support WebGL.')
		document.body.appendChild(node);
	}
})();
