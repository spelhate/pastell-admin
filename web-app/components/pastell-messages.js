/*
 * Usage : <pastell-message></pastell-message>

 * const messenger = document.querySelector("pastell-messages");
 * messenger.send("Message", "tag"", 'error|success');


*/
const template2 = document.createElement('template');
template2.innerHTML = `
<style>
.toast-container {
    position: absolute;
    bottom: 10px;
    right: 10px;
}

.toast.bg-info .bi {
    color: #0dcaf0;
    padding-right: 10px;
}

.toast.bg-danger .bi {
    color: #dc3545;
    padding-right: 10px;
}
</style>
<div class="toast-container"></div>
`;

class PastellMessages extends HTMLElement{

 constructor(){

     super();
     this.appendChild(template2.content.cloneNode(true));
 }

  send(msg, tag, type) {
	const tpl = document.createElement('template');
	const id = `id-${Date.now()}`;
	const options = {'autohide': true };
    if (type === 'error') {
		options.autohide = false;
		tpl.innerHTML = `
		<div id="${id}" class="toast text-white bg-danger" role="alert" aria-live="assertive" aria-atomic="true">
		<div class="toast-header">
		  <i class="bi bi-cloud-lightning-fill"></i>
		  <strong class="me-auto">Erreur Pastell</strong>
		  <small class="text-muted">${tag}</small>
		  <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
		</div>
		<div class="toast-body">${msg}</div>
	  </div>
		`;

	} else if (type === 'success') {
		tpl.innerHTML = `
		<div id="${id}" class="toast text-white bg-info" role="alert" aria-live="assertive" aria-atomic="true">
		<div class="toast-header">
		  <i class="bi bi-check-square-fill"></i>
		  <strong class="me-auto">Succès</strong>
		  <small class="text-muted">${tag}</small>
		  <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
		</div>
		<div class="toast-body">${msg}</div>
	  </div>`;

	}

	this.querySelector('.toast-container').appendChild(tpl.content.cloneNode(true));
	const element = this.querySelector(`.toast-container #${id}`);
	const toast = new bootstrap.Toast(element, options);
	toast.show();

  }



}
window.customElements.define('pastell-messages', PastellMessages);