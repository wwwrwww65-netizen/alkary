	function r(f){/in/.test(document.readyState)?setTimeout('r('+f+')',9):f()}

	r(function(){
	    var input = document.querySelectorAll("input");
		input.forEach(function(e,i) {
			e.addEventListener("focus", function(){
				this.classList.add("focused");
				var lbl = this.parentNode ? this.parentNode.querySelector('label') : null;
				if(lbl) lbl.classList.add("focused");
			});
			e.addEventListener("focusout", function(){
				if(!e.value) {
					this.classList.remove("focused");
					var lbl = this.parentNode ? this.parentNode.querySelector('label') : null;
					if(lbl) lbl.classList.remove("focused");
				}
			});
		});

		var submitBtn = document.getElementById("submit_btn");
		if(submitBtn) {
			submitBtn.addEventListener("click",function() {
				var spinner = document.querySelector(".spinner");
				if(spinner) spinner.classList.add("show");
			});
		}
		
		var modal = document.querySelector(".alert_overlay");
		if(modal !== null) {
			modal.addEventListener("click",function() {
				this.style.display="none";
			});
		}
		
		var menu_btn = document.querySelector("#tog_btn");
		var menu = document.querySelector("#menu");
		if(menu_btn && menu) {
			menu_btn.addEventListener("click",function() {
				menu.classList.toggle("slided");
			});

			window.addEventListener('click', function(e){   
			  if (!menu.contains(e.target) && !menu_btn.contains(e.target)){
			    menu.classList.remove("slided");
			  }
			});
		}
	});