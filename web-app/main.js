const keycloak = Keycloak();
var k_options;
var ref_profiles;
var tree = {};

const fuse_options = {
    includeScore: true,
    threshold: 0.3,
    // Search in `author` and in `tags` array
    keys: [
        { "name": "denomination", "weight": 0.7},
        { "name": "id_e", "weight": 0.2},
        { "name": "siren", "weight": 0.1},
    ]
}

async function logout () {
    const logout_url = k_options["logout-url"];
    await keycloak.logout(logout_url);
}


async function loadConfig () {
    let items = [];
    const response = await fetch('profiles.json');
    const profiles = await response.json();
    const response2 = await fetch('keycloak.json');
    k_options = await response2.json();
    ref_profiles = profiles;
    profiles.profiles.forEach(function(profile, index) {

        items.push(`<div class="profile-item col col-lg-4">
            <div class="card">
            <label class="card-body">
                <h5 class="card-title">
                    <input class="form-check-input me-1" name="profiles" type="checkbox" value="${profile.id}">
                    <i class="bi-collection" style="font-size: 1.7rem;"></i>
                </h5>
                <p class="card-text">${profile.id}</p>
            </label>
            </div>
        </div>`)
    })
    document.getElementById("profiles").innerHTML = items.join("");
}
function initKeycloak() {
    loadConfig();
    keycloak.init({ onLoad: 'login-required', checkLoginIframe:false }).success(function(authenticated) {
        if (authenticated) {
            const credentials = keycloak.tokenParsed;
            console.log(credentials);
            document.getElementById("userid").textContent = credentials.preferred_username;
            //check if user is super admin
            if (credentials?.usertype == 'ADMIN') {
                getEntities();
            } else {
                // user is not allowed
            }

        }

        //alert(authenticated ? 'authenticated' : 'not authenticated');
    }).error(function() {
        alert('failed to initialize');
    });
}

async function getVersion() {
    const response = await fetch('http://localhost:5005/version', {
        headers: {
            'Authorization': 'Bearer ' + keycloak.token
        }
    });
    const result = await response.json();
    console.log(result);

}
async function getEntities() {
    const response = await fetch('http://localhost:5005/entite', {
        headers: {
            'Authorization': 'Bearer ' + keycloak.token
        }
    });
    const result = await response.json();
    let entities = [];
    let o = {"level_1": {},"level_2": {}, "level_3":{},  "level_4":{}};
    let organigramme = [];
    if (result.entities) {
        Object.entries(result.entities).forEach((key, value) => {
            entities.push(key[1]);
            if (key[1].entite_mere == "0") {
                o.level_1[key[1].id_e] = {"id_e": key[1].id_e, "type": key[1].type, "denomination" : key[1].denomination, "entite_mere": key[1].entite_mere, "filles":[]};
            } else {
                o.level_2[key[1].id_e] = {"id_e": key[1].id_e, "type": key[1].type, "denomination" : key[1].denomination,  "entite_mere": key[1].entite_mere,  "filles":[]};
            }
        });
        //first step (level 2)
        Object.entries(o.level_2).forEach((key, value) => {
            if (o.level_2[key[1].entite_mere]) {
                // level 3
                o.level_3[key[1].id_e] = {"id_e": key[1].id_e, "type": key[1].type, "denomination" : key[1].denomination,  "entite_mere": key[1].entite_mere, "filles": []};
                delete o.level_2[key[1].id_e];
            }
        })

        // level 4
        Object.entries(o.level_3).forEach((key, value) => {
            if (o.level_3[key[1].entite_mere]) {
                o.level_4[key[1].id_e] = {"id_e": key[1].id_e, "type": key[1].type, "denomination" : key[1].denomination,  "entite_mere": key[1].entite_mere};
                delete o.level_3[key[1].id_e];
            }
        })

        Object.entries(o.level_4).forEach((key, value) => {
            if (o.level_3[key[1].entite_mere]) {
                o.level_3[key[1].entite_mere].filles.push(key[1]);
            }
        })

        Object.entries(o.level_3).forEach((key, value) => {
            if (o.level_2[key[1].entite_mere]) {
                o.level_2[key[1].entite_mere].filles.push(key[1]);
            }
        })

        Object.entries(o.level_2).forEach((key, value) => {
            if (o.level_1[key[1].entite_mere]) {
                o.level_1[key[1].entite_mere].filles.push(key[1]);
            }
        })

        Object.entries(o.level_1).forEach((key, value) => {
            organigramme.push(key[1]);

        })

        const wc = document.querySelector("pastell-organisation");
        wc.addEventListener("itemClicked", function(e) {
            console.log(e.detail);
            const ctrl = document.getElementById("selected_orga");
            ctrl.value = e.detail.path;
            ctrl.dataset.path = e.detail.path;
            ctrl.dataset.denomination =  e.detail.denomination;
            ctrl.dataset.id_e =  e.detail.id_e;
            getUsers(e.detail.id_e);
        });
        wc.data = organigramme;

    }

}

async function getUsers(id_e) {
    console.log(id_e);
    const response = await fetch(`http://localhost:5005/entite_users/${id_e}`, {
        headers: {
            'Authorization': 'Bearer ' + keycloak.token
        }
    });
    const result = await response.json();
    let lst = [];
    if (result.users) {
        result.users.forEach(usr => {
            if (usr.email.indexOf("DELETED_") === -1) {
                const tpl = `<div class="user-item col col-lg-4">
                <div class="card">
                <label class="card-body">
                    <h5 class="card-title">
                        <input class="form-check-input me-1" name="users" type="checkbox" value="${usr.id_u}">
                        ${usr.id_u}
                        <i class="bi-person-badge" style="font-size: 2rem;"></i>
                    </h5>
                    <p class="card-text">${usr.email}</p>
                </label>
                </div>
            </div>`;

            lst.push(tpl);

            }

        });
        document.getElementById("counter2").textContent = 0;
        document.getElementById("user-list").innerHTML = lst.join("");
        document.querySelectorAll("#user-list input").forEach(ctrl => {
            ctrl.addEventListener("change", function(e) {
                e.target.closest('.card').classList.toggle('selected');
                const counter = document.querySelectorAll('#user-list input:checked').length;
                document.getElementById("counter2").textContent = counter;
            })
        })

    }

}

async function setProfile(id_u, id_e, roles) {
    const response = await fetch(`http://localhost:5005/role/${id_u}/${id_e}`, {
        method: 'POST',
        body: JSON.stringify(roles),
        headers: {
            'Authorization': 'Bearer ' + keycloak.token,
            'Content-Type': 'application/json'
        }
    });
    const result = await response.json();
    if (result) {
        const messenger = document.querySelector("pastell-messages");
        const ok = result.actions.filter(a => { return a.result?.result === 'ok' }).map(result => result.role);
        const ko =  result.actions.filter(a => { return a.result?.status === 'error' }).map(result => result.result['error-message']);
        if (ok.length > 0) {
            messenger.send(`${ok.length} rôle(s) ajouté(s) avec succès`, result.user, 'success');
        }

        if (ko.length > 0) {
            messenger.send(ko.join("</br>"), result.user, 'error');

        }



    }

}

function setProfiles() {
    //selected users
    let users = [];
    let profiles = [];
    let roles = [];
    const orga = document.getElementById("selected_orga").dataset.id_e;
    const lst = document.querySelectorAll("#user-list input:checked");
    lst.forEach(function (el) {
        users.push(el.value);
    })
    let profiles_lst =document.querySelectorAll("#profiles input:checked");
    profiles_lst.forEach(function (el, index) {
        profiles.push(el.value);
    })
    ref_profiles.profiles.forEach(function(profile, index) {
        if (profiles.includes(profile.id)) {
            roles = roles.concat(profile.roles);
        }
    })
    users.forEach(function(user, index) {
        setProfile(user, orga, roles);
    })


}

async function getRoles(id_u) {
    const response = await fetch(`http://localhost:5005/role/${id_u}`, {
        headers: {
            'Authorization': 'Bearer ' + keycloak.token
        }
    });
    const result = await response.json();
    console.log(result.roles);

}

function selectUser(el) {
    const user = el.querySelector(`option[value="${el.value}"]`);
    getRoles(user.value);
    const el2 = document.getElementById("selected_orga");
    const orga = el2.dataset;
    const tpl = `
        <li data-id_u="${user.value}" class="list-group-item d-flex justify-content-between lh-sm">
            <div>
            <h6 class="my-0">${user.dataset.email}</h6>
            <small class="text-muted">${orga.path}</small>
            </div>
            <span class="text-muted">${user.value}</span>
        </li>`;
    const parser = new DOMParser();
    let item = parser.parseFromString(tpl, "text/html").querySelector(".list-group-item");
    document.getElementById("user-selection").appendChild(item);
    const items = document.getElementById("user-selection").querySelectorAll(".list-group-item");
    document.getElementById("counter").textContent = items.length
}