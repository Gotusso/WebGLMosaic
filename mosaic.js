(function() {
	var SIZE_FACTOR = 22;
	var TRANSITION_LENGTH = 5000;
	var FLIP_ANIMATION_TIME = 3000;
	var COLOR_ANIMATION_TIME = 1500;

	var scene = new THREE.Scene();
	//var camera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 0, 1000 );
	var camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
	camera.position.x = window.innerWidth / 2;
	camera.position.y = window.innerHeight / 2;
	camera.position.z = 630;

	var i = 0;
	var w = 0;
	var h = 0;
	var size = window.innerWidth / SIZE_FACTOR;

	var shape1 = new THREE.Shape();
	shape1.moveTo(0, 0);
	shape1.lineTo(size, 0);
	shape1.lineTo(0, size);
	shape1.lineTo(0, 0);

	var shape2 = new THREE.Shape();
	shape2.moveTo(size, 0);
	shape2.lineTo(size, size);
	shape2.lineTo(0, size);
	shape2.lineTo(size, 0);

	var shape3 = new THREE.Shape();
	shape3.moveTo(0, 0);
	shape3.lineTo(size, size);
	shape3.lineTo(size, 0);
	shape3.lineTo(0, 0);

	var shape4 = new THREE.Shape();
	shape4.moveTo(0, 0);
	shape4.lineTo(0, size);
	shape4.lineTo(size, size);
	shape4.lineTo(0, 0);

	var meshes = [];
	while (h < window.innerHeight) {
		while (w < window.innerWidth) {
			var even = i % 2 === 0;
			var downShape = even ? shape1 : shape3;
			var upShape = even ? shape2 : shape4;

			var downColor = new THREE.Color(Math.random() * 0.7, 1, Math.random() * 0.7);
			var upColor = new THREE.Color(Math.random() * 0.7, 1, Math.random() * 0.7);

			var downTriangle = new THREE.Mesh(new THREE.ShapeGeometry(downShape), new THREE.MeshBasicMaterial({color: downColor, side: THREE.DoubleSide}));
			var upTriangle = new THREE.Mesh(new THREE.ShapeGeometry(upShape), new THREE.MeshBasicMaterial({color: upColor, side: THREE.DoubleSide}));
			
			downTriangle.position.x = w;
			downTriangle.position.y = h;
			upTriangle.position.x = w;
			upTriangle.position.y = h;

			scene.add(downTriangle);
			scene.add(upTriangle);
			
			meshes.push(downTriangle);
			meshes.push(upTriangle);

			i++;
			w += size;
		}

		w = 0;
		h += size;
	}

	window.addEventListener('resize', function() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
	}, false);

	// Robert Penner’s style animations
	var animate = {
		inBack: function(timestamp, begin, end, total) {
			return (function(t, b, c, d, s) {
				if (s == undefined) s = 1.70158;
				return c*(t/=d)*t*((s+1)*t - s) + b
			})(timestamp, begin, end - begin, total);
		},
		inOutBack: function(timestamp, begin, end, total) {
			return (function(t, b, c, d, s) {
				if (s == undefined) s = 1.70158; 
				if ((t/=d/2) < 1) return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
				return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b
			})(timestamp, begin, end - begin, total);
		}
	};

	var triggers = [];
	meshes.forEach(function(mesh) {
		var fireTime = Math.random() * TRANSITION_LENGTH;
		var lastFrame = 0;

		var srcColor = mesh.material.color;
		var dstColor = {
			r: 1,
			g: Math.random() * 0.7,
			b: Math.random() * 0.7
		};

		var meshAnimations = [
			function(timestamp) {
				mesh.quaternion.setFromAxisAngle(
					new THREE.Vector3(1, 1, 0).normalize(), 
					animate.inOutBack(timestamp, 0, Math.PI, FLIP_ANIMATION_TIME));
			},
			function(timestamp) {
			},
			function(timestamp) {
			},
			function(timestamp) {
				mesh.quaternion.setFromAxisAngle(
					new THREE.Vector3(1, 1, 0).normalize(), 
					animate.inOutBack(timestamp, Math.PI, 0, FLIP_ANIMATION_TIME));
			},
			function(timestamp) {
			},
			function(timestamp) {
			}
		];
		var colorAnimations = [
			function(timestamp) {
				mesh.material.color = new THREE.Color(
					animate.inBack(timestamp, srcColor.r, dstColor.r, COLOR_ANIMATION_TIME),
					animate.inBack(timestamp, srcColor.g, dstColor.g, COLOR_ANIMATION_TIME),
					animate.inBack(timestamp, srcColor.b, dstColor.b, COLOR_ANIMATION_TIME));
			},
			function(timestamp) {
			},
			function(timestamp) {
			},
			function(timestamp) {
			},
			function(timestamp) {
			},
			function(timestamp) {
			},
			function(timestamp) {
				mesh.material.color = new THREE.Color(
					animate.inBack(timestamp, dstColor.r, srcColor.r, COLOR_ANIMATION_TIME),
					animate.inBack(timestamp, dstColor.g, srcColor.g, COLOR_ANIMATION_TIME),
					animate.inBack(timestamp, dstColor.b, srcColor.b, COLOR_ANIMATION_TIME));
			},
			function(timestamp) {
			},
			function(timestamp) {
			},
			function(timestamp) {
			},
			function(timestamp) {
			},
			function(timestamp) {
			}
		];

		triggers.push(function(timestamp) {
			var animationTime = timestamp - fireTime;
			if (animationTime < 0) {
				return;
			}

			lastFrame = animationTime;

			var meshDelta = animationTime % FLIP_ANIMATION_TIME;
			var meshIteration = Math.floor(animationTime / FLIP_ANIMATION_TIME) % meshAnimations.length;
			meshAnimations[meshIteration](meshDelta);

			var colorDelta = animationTime % COLOR_ANIMATION_TIME;
			var colorIteration = Math.floor(animationTime / COLOR_ANIMATION_TIME) % colorAnimations.length;
			colorAnimations[colorIteration](colorDelta);
		});
	});

	var last = 0;
	var render = function(timestamp) {
		requestAnimationFrame(render);

		var delta = timestamp - last;
		last = timestamp;

		if (timestamp) {
			triggers.forEach(function(trigger) {
				trigger(timestamp);
			});
		}
		
		renderer.render(scene, camera);
	};
	var renderer = new THREE.WebGLRenderer();
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);

	render();
})();
