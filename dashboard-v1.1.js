// ----- Chart data (rendered by Jinja) ------------------------------
const dayLabels = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const dayCounts = dayLabels.map((_,i)=>scheduleByDay[i].length);

// ----- Chart -------------------------------------------------------
new Chart(document.getElementById('dayChart'),{
  type:'bar',
  data:{labels:dayLabels,datasets:[{data:dayCounts,borderWidth:1}]},
  options:{
    responsive:true,maintainAspectRatio:false,
    plugins:{legend:{display:false},tooltip:{callbacks:{
      afterLabel:ctx=>'click for list'
    }}},
    scales:{y:{beginAtZero:true,precision:0,ticks:{stepSize:1}}},
    onClick:(e,els)=>{if(els.length)showModal(els[0].index);}
  }
});

// ----- Modal -------------------------------------------------------
const modal = document.getElementById('dayModal');
const modalTitle = document.getElementById('modalTitle');
const modalList = document.getElementById('modalList');

function showModal(idx) {
  const items = scheduleByDay[idx];

  const grouped = items.reduce((acc, item) => {
    if (!acc[item.name]) acc[item.name] = [];
    acc[item.name].push(item.id);
    return acc;
  }, {});

  const totalSchedules = items.length;
  const totalClients = Object.keys(grouped).length;

  modalTitle.textContent = `${dayLabels[idx]} – ${totalSchedules} schedule${totalSchedules !== 1 ? 's' : ''} across ${totalClients} client${totalClients !== 1 ? 's' : ''}`;

  modalList.innerHTML = Object.entries(grouped).map(([name, ids], i) => {
    const groupId = `clientGroup${idx}_${i}`;
    const collapsedList = ids.map(id =>
      `<li><a href="https://braintek.immy.bot/schedules/${id}/edit" target="_blank" rel="noopener">• Schedule #${id}</a></li>`
    ).join('');

    return `
      <li style="margin-bottom: 0.5rem;">
        <div style="cursor:pointer; font-weight:600;" onclick="toggleGroup('${groupId}', this)">
          <span class="caret" style="display:inline-block; transform:rotate(-90deg); width:1rem;">▸</span>
          ${name} (${ids.length})
        </div>
        <ul id="${groupId}" style="display:none; padding-left:1rem; margin-top:0.25rem;">
          ${collapsedList}
        </ul>
      </li>
    `;
  }).join('');

  modal.classList.add('active');
}

// Toggle collapse for group
function toggleGroup(id, header) {
  const list = document.getElementById(id);
  const caret = header.querySelector('.caret');
  const isOpen = list.style.display === 'block';
  list.style.display = isOpen ? 'none' : 'block';
  caret.textContent = isOpen ? '▸' : '▾';
  caret.style.transform = isOpen ? 'rotate(-90deg)' : 'rotate(0deg)';
}

// Collapse behaviour
function toggleCollapse(trg){
  const panel=document.getElementById(trg.dataset.target);
  if(!panel)return;
  const coll=panel.classList.toggle('collapsed');
  const btn=trg.classList.contains('collapse-btn')?trg:trg.querySelector('.collapse-btn');
  btn.classList.toggle('collapsed-btn',coll);btn.setAttribute('aria-expanded',!coll);
}
document.querySelectorAll('.collapse-btn').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();toggleCollapse(b);}));
document.querySelectorAll('.section-header').forEach(h=>{
  h.addEventListener('click',e=>{if(!e.target.closest('.collapse-btn'))toggleCollapse(h);});
  h.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggleCollapse(h);}});
});

// Row hover highlight
function bindHover(sel){
  document.querySelectorAll(`${sel} tbody tr[data-tenant]`).forEach(r=>{
    const id=r.dataset.tenant;
    r.onmouseenter=()=>document.querySelectorAll(`tr[data-tenant="${id}"]`).forEach(x=>x.classList.add('row-hover'));
    r.onmouseleave=()=>document.querySelectorAll(`tr[data-tenant="${id}"]`).forEach(x=>x.classList.remove('row-hover'));
  });
}
bindHover('#withSchedulesTable');bindHover('#missingSchedulesTable');

// Hide duplicate tenant names
function hideDuplicateTenantNames() {
  const tenantCells = document.querySelectorAll('#withSchedulesTable tbody td:first-child');
  let last = '';
  tenantCells.forEach(cell => {
    const name = cell.textContent.trim();
    if (name === last) {
      cell.textContent = ''; // Hide duplicate
    } else {
      last = name;
    }
  });
}

// ======================  GROUP-AWARE SEARCH  =======================
const searchInput=document.getElementById('tableSearch');
const clearBtn=document.getElementById('clearSearch');
const groups=new Map();                // tenantId → [ <tr>, <tr>, … ]

document.querySelectorAll('tbody tr[data-tenant]').forEach(r=>{
  const id=r.dataset.tenant;
  if(!groups.has(id))groups.set(id,[]);
  groups.get(id).push(r);
});

const normalize=s=>s.toLowerCase().replace(/\s+/g,' ').trim();

function runSearch() {
  const q = normalize(searchInput.value);
  clearBtn.hidden = !q;

  groups.forEach((rows, id) => {
    let anyMatch = false;

    rows.forEach(r => {
      const text = normalize(r.textContent);
      const match = !q || text.includes(q);
      r.style.display = match ? '' : 'none';
      if (match) anyMatch = true;
    });
  });
}

searchInput.addEventListener('input',runSearch);
clearBtn.addEventListener('click',()=>{searchInput.value='';runSearch();searchInput.focus();});

// Modal close events
document.getElementById('modalClose').onclick = () => modal.classList.remove('active');
modal.onclick = e => { if (e.target === modal) modal.classList.remove('active'); };
document.addEventListener('keydown', e => { if (e.key === 'Escape') modal.classList.remove('active'); });
