/*
 * Usage : <pastell-organisation name="Organismes Pastell" ></pastell-organisation>

 * const wc = document.querySelector("pastell-organisation");
 * wc.addEventListener("itemClicked", function(e) {console.log(e.detail)});
 * wc.data = a;


*/
const template = document.createElement('template');
template.innerHTML = `
<style>
	/* use import it with shadowRoot */
  /*@import "https://cdn.jsdelivr.net/npm/bootstrap@5.2.0-beta1/dist/css/bootstrap.min.css";
  @import "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.8.2/font/bootstrap-icons.css";*/

  .btn-toggle {
	display: inline-flex;
	align-items: center;
	padding: .25rem .5rem;
	font-weight: 600;
	color: rgba(0, 0, 0, .65);
	background-color: transparent;
	border: 0;
  }
  .btn-toggle:hover,
  .btn-toggle:focus {
	color: rgba(0, 0, 0, .85);
	background-color: #d2f4ea;
  }

  .btn-toggle::before {
	width: 1.25em;
	line-height: 0;
	content: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='rgba%280,0,0,.5%29' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M5 14l6-6-6-6'/%3e%3c/svg%3e");
	transition: transform .35s ease;
	transform-origin: .5em 50%;
  }

  .btn-toggle[aria-expanded="true"] {
	color: rgba(0, 0, 0, .85);
  }
  .btn-toggle[aria-expanded="true"]::before {
	transform: rotate(90deg);
  }

  .btn-toggle-nav a {
	display: inline-flex;
	padding: .1875rem .5rem;
	margin-top: .125rem;
	margin-left: 1.25rem;
	text-decoration: none;
  }
  .btn-toggle-nav a:hover,
  .btn-toggle-nav a:focus {
	background-color: #d2f4ea;
  }


  .btn-toggle {
		padding-right: 25px;
		text-align: left;
	}
	.level-2>button, .level-2>.detail{
		padding-left: 25px;
		text-align: left;
	}

	.level-3>button, .level-3>.detail{
		padding-left: 25px;
		text-align: left;
		font-size: 12px;
		font-weight: 700;
	}

	.input-group.search {
		padding-left: 30px;
		padding-right: 30px;
	}

	#static-menu {
		position: sticky;
		top: -30px;
		width: 100%;
		background: #fff;
		margin: 0;
	}

	li.level-1 {
		display: none;
	}

	li.level-1.filtered {
		display: block;
	}

	.filtered>.detail.collapse.show {
		background: azure;
		border-left: dashed 2px grey;
	}



</style>
<ul class="nav nav-pills flex-column mb-sm-auto mb-0 align-items-start" id="menu">
	<div id="static-menu">
		<li class="nav-item">
			<a href="#" class="nav-link text-truncate">
				<i class="fs-5 bi-info-circle"></i><span id="title" class="ms-1 d-none d-sm-inline">Organismes</span>
			</a>
		</li>
		<div class="search input-group mb-3">
		<span class="input-group-text" id="search">@</span>
		<input id="searchEntities" class="form-control me-2" type="search" placeholder="Organismes..." aria-label="Search">
		</div>
	</div>
	<div class="flex-shrink-0 p-3 bg-white" >
		<ul id="organismes" class="list-unstyled ps-0"></ul>
	</div>
</ul>
`;

class PastellOrganisation extends HTMLElement{

  static get observedAttributes() {
        return ['name'];
	}

 constructor(){

     super();
     //this.attachShadow({ mode: 'open'});
     //this.shadowRoot.appendChild(template.content.cloneNode(true));
     this.appendChild(template.content.cloneNode(true));
	 this._data = [];
	 this._selection = false;
	 this._title = "Organismes";
	 this.wcTitle = this.querySelector("#title");
	 if(this.hasAttribute('name')) {
		 this._title = this.getAttribute('name');
	 }
	 this.wcTitle.innerText = this._title;
	 this._index = [];
	 this.fuse_options = {
		includeScore: true,
		threshold: 0.3,
		// Search in `author` and in `tags` array
		keys: [
			{ "name": "denomination", "weight": 0.7},
			{ "name": "id_e", "weight": 0.2}
		]
	}
	this.fuse = {};
 }

  set data(value) {
    this._data = value;
	this.render();
  }

  get data() {
    return this._data;
  }




	 clicked(e) {
		 this._selection = "123";
		 this.parentElement.dispatchEvent(new CustomEvent("clicked", { detail: this._selection }));
	 }

	 levelClicked() {
		const self = this;
		const org = this.querySelector("#organismes");
		const orga_items = org.querySelectorAll("button,a");

		orga_items.forEach(function(el) {
			el.addEventListener("click", function(e) {
				let currentEl = e.target
				//colapse all root elements
				if (currentEl.closest("li").classList.contains("level-1")) {
					let collapsed_items = org.querySelectorAll(".collapse.show");
					collapsed_items.forEach(function(item) {
						if (item != currentEl.nextElementSibling) {
							bootstrap.Collapse.getInstance(item).hide();
						}

					})
				}
				const path = [];
				[1,2,3].forEach(i => {
					if (currentEl.closest(`.level-${i}`)) {
						path.push(currentEl.closest(`.level-${i}`).querySelector("button").dataset.denomination);
					}

				})

				self._selection = currentEl.dataset["id_e"];
				const denomination = currentEl.dataset["denomination"];
				if (!path.includes(denomination)) {
					path.push(denomination);
				}
				self.dispatchEvent(new CustomEvent("itemClicked", { detail: {'path': path.join(" / "), 'id_e' : self._selection, 'denomination': denomination }}));

			})
		})
	 }

	render() {
		const self = this;
		let html = [];
		let filles1 = [];
		let filles2 = [];
		this._data.forEach(function(lv1,i) {
			self._index.push({'id_e': lv1.id_e, 'denomination': lv1.denomination});
			if (lv1.filles.length > 0) {
				filles1 = [];
				lv1.filles.forEach(function(lv2,i) {
					filles2 = [];
					lv2.filles.forEach(function(lv3,i) {
						const item_lv3 = self.renderLevel("level-3", lv3.denomination, lv3.id_e, lv3.filles);
						filles2.push(item_lv3);
					})
					const item_lv2 = self.renderLevel("level-2", lv2.denomination, lv2.id_e, filles2, true);
					filles1.push(item_lv2);
				})
				const item_lv1 = self.renderLevel("level-1", lv1.denomination, lv1.id_e, filles1, true);
			  html.push(item_lv1);
			} else {
				// pas de fille
				console.log("pas de fille");
			}

		});
		this.configureSearch(this._index);
		const org = this.querySelector("#organismes");
		org.innerHTML = html.join("");
		this.levelClicked();
	}

	configureSearch(entities) {
		this.fuse = new Fuse(entities, fuse_options);
        this.querySelector("#searchEntities").addEventListener("keyup", this.filterEntities.bind(this));
		this.querySelector("#searchEntities").addEventListener("search", this.filterEntities.bind(this));
	}

	filterEntities (e) {
		const self = this;
		const filtered = this.querySelectorAll(".level-1.filtered");
		filtered.forEach(el => el.classList.toggle("filtered"));
		if (e.type === 'keyup') {
			const value = e.target.value;
			if (value.length > 2) {
				const results = this.fuse.search(value);
				console .log(results);
				results.forEach( function(r) {
					console.log(r.item.id_e);
					const match = self.querySelector(`.level-1 [data-id_e="${r.item.id_e}"]`);
					if (match) {
						match.closest("li").classList.add("filtered");
					} else {
						console.log (`item : ${r.item.id_e} -  ${r.item.denomination} non trouvée dans la liste!` )
					}

				})
			}
		}

	}



	renderLevel(level, denomination, id_e, childrens, formated) {
		let item;
		let filles = [];
		if (formated) {
			filles = childrens;
		}

		if (childrens.length > 0) {
			if (!formated) {
				childrens.forEach(function(f) {
					filles.push(`<li><a href="#" data-id_e="${f.id_e}" data-denomination="${f.denomination}" class="link-dark rounded">${f.denomination}</a></li>`);
				})
			}

			item = `<li class="${level} mb-1">
				<button class="btn btn-toggle align-items-center rounded collapsed" data-id_e="${id_e}" data-denomination="${denomination}" data-bs-toggle="collapse"
					data-bs-target="#id_e${id_e}" aria-expanded="false">${denomination}
				</button>
				<div class="detail collapse" id="id_e${id_e}">
				  <ul class="btn-toggle-nav list-unstyled fw-normal pb-1 small">
					${filles.join("")}
				  </ul>
				</div>
			</li>`


		} else {
			item = `<li><a href="#" data-id_e="${id_e}" data-denomination="${denomination}" class="link-dark rounded">${denomination}</a></li>`;
		}
		return item;


	}

 connectedCallback(){
   //this.shadowRoot.querySelector("#menu").addEventListener('click', this.clicked);
   this.querySelector("#menu").addEventListener('click', this.clicked.bind(this), false);
 }

attributeChangedCallback(name, oldValue, newValue) {
        if (name !== 'name') {
            return;
        }
		this._title = newValue;
        this.wcTitle.innerText = this._title;
}



}
window.customElements.define('pastell-organisation', PastellOrganisation);