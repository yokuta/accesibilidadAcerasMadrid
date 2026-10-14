/* Herramientas del relato. Los cálculos utilizan el mismo manifest que el mapa. */
(() => {
  'use strict';
  const api = window.MadridExtras = {mapOnly:false, restoreFromUrl};
  let restored = false;
  const slots = ['a','b'];
  const ownedParams = ['d','lat','lng','z','a','b'];
  const byId = id => document.getElementById(id);
  const selected = slot => districtInfo(byId('compare-'+slot).value);

  function setMapMode(enabled) {
    api.mapOnly = enabled;
    byId('map-story').classList.toggle('map-only', enabled);
    byId('map-view-toggle').setAttribute('aria-pressed', String(enabled));
    byId('map-view-toggle').textContent = enabled ? 'Volver al relato' : 'Ver solo el mapa';
    byId('map-explore').open = false;
    if (enabled) guidedReading = false;
    document.dispatchEvent(new Event('madrid:modechange'));
  }
  byId('map-view-toggle').addEventListener('click', () => {
    if (api.mapOnly) {
      setMapMode(false);
      const step = storySteps[activeStoryIndex];
      window.scrollTo({top:step.getBoundingClientRect().top+scrollY+step.offsetHeight*.15,behavior:'instant'});
      focusStoryStep(activeStoryIndex, false);
    } else setMapMode(true);
  });
  document.querySelectorAll('.nav a,.map-chapters a').forEach(link=>link.addEventListener('click',()=>{
    if(api.mapOnly)setMapMode(false);
  }));

  function openDistrictMap(id, {fit=true}={}) {
    if (!districtMap || !manifest) return;
    setMapMode(true);
    focusStoryStep(storySteps.length-1, false);
    const step = storySteps.at(-1);
    window.scrollTo({top:step.getBoundingClientRect().top+scrollY+120,behavior:'instant'});
    selectDistrict(String(id),{fit});
    byId('map-view-toggle').focus({preventScroll:true});
  }

  function baseLink(anchor) {
    const url = new URL(location.href);
    ownedParams.forEach(key => url.searchParams.delete(key));
    url.hash = anchor;
    return url;
  }
  async function copyLink(url, kind) {
    const feedback = byId(kind+'-share-status');
    const field = byId(kind+'-share-link');
    field.hidden = true;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(url.href);
      feedback.textContent = 'Enlace copiado. Al abrirlo se recuperará esta '+(kind==='map'?'vista.':'comparación.');
    } catch {
      field.hidden = false; field.value = url.href;
      field.focus({preventScroll:true});field.select();
      feedback.textContent = 'Selecciona y copia este enlace para compartirlo.';
    }
  }
  byId('share-map').addEventListener('click', () => {
    if (!districtMap || !manifest) return;
    districtMap.stop();
    const url = baseLink('parada-explora'), center = districtMap.getCenter();
    url.searchParams.set('d', activeDistrict);
    url.searchParams.set('lat', center.lat.toFixed(6));
    url.searchParams.set('lng', center.lng.toFixed(6));
    url.searchParams.set('z', String(districtMap.getZoom()));
    copyLink(url, 'map');
  });
  byId('share-comparison').addEventListener('click', () => {
    const url = baseLink('comparar');
    slots.forEach(slot => url.searchParams.set(slot, byId('compare-'+slot).value));
    copyLink(url, 'comparison');
  });

  function referenceText(value) {
    const difference = value - manifest.global.pct;
    if (Math.abs(difference)<.05) return 'En la referencia del conjunto de Madrid';
    return dec(Math.abs(difference))+' puntos porcentuales '+(difference>0?'por encima':'por debajo')+' de Madrid';
  }
  function renderComparison() {
    if (!manifest) return;
    const a = selected('a'), b = selected('b');
    if (!a || !b) return;
    slots.forEach(slot => {
      const d = selected(slot), hasData = d.total>0 && Number.isFinite(d.pct);
      byId('compare-'+slot+'-pct').textContent = hasData ? dec(d.pct) : '—';
      byId('compare-'+slot+'-below').textContent = nf.format(d.below);
      byId('compare-'+slot+'-total').textContent = nf.format(d.total);
      byId('compare-'+slot+'-bar').style.width = (hasData?Math.max(0,Math.min(100,d.pct)):0)+'%';
      byId('compare-'+slot+'-reference').style.left = manifest.global.pct+'%';
      byId('compare-'+slot+'-delta').textContent = hasData ? referenceText(d.pct) : 'Sin mediciones válidas para comparar';
      const mapButton=byId('compare-'+slot+'-map');
      mapButton.textContent='Explorar '+d.name+' en el mapa ↗';
      mapButton.disabled=!districtMap;
    });
    byId('compare-city').textContent = pct(manifest.global.pct);
    const caption = byId('comparison-insight');
    if (a.id===b.id) {
      byId('comparison-gap').textContent='El mismo distrito';
      caption.textContent='Has seleccionado '+a.name+' en ambos lados. Elige otro distrito para contrastar sus cifras.';
    } else if (!a.total || !b.total || !Number.isFinite(a.pct) || !Number.isFinite(b.pct)) {
      byId('comparison-gap').textContent='Muestra insuficiente';
      caption.textContent='No hay mediciones válidas en ambos distritos para calcular una diferencia.';
    } else {
      const high=a.pct>=b.pct?a:b, low=high===a?b:a, more=a.below>=b.below?a:b;
      const difference=Math.abs(a.pct-b.pct);
      byId('comparison-gap').textContent=dec(difference)+' puntos porcentuales';
      caption.textContent=(difference<.05?'Las proporciones son prácticamente iguales. ':high.name+' tiene una proporción mayor de puntos estrechos que '+low.name+'. ')+
        'En cantidad, '+more.name+' reúne más: '+nf.format(more.below)+' puntos bajo 1,80 m. La proporción compara la frecuencia; la cantidad muestra cuántas mediciones representa.';
    }
    byId('comparison-share-status').textContent='';
    byId('comparison-share-link').hidden=true;
  }
  slots.forEach(slot => {
    byId('compare-'+slot).addEventListener('change', renderComparison);
    byId('compare-'+slot+'-map').addEventListener('click', () => openDistrictMap(byId('compare-'+slot).value));
  });
  byId('swap-comparison').addEventListener('click', () => {
    const a=byId('compare-a'),b=byId('compare-b'),value=a.value;
    a.value=b.value;b.value=value;renderComparison();
  });
  byId('download-comparison').addEventListener('click', () => {
    if (!manifest) return;
    const quote = v => '"'+String(v).replaceAll('"','""')+'"';
    const values=[...new Map(slots.map(slot=>{const d=selected(slot);return [d.id,d];})).values()];
    values.push({...manifest.global,name:'Madrid (conjunto analizado)'});
    const rows=[['Territorio','Puntos analizados','Puntos bajo 1,80 m','Porcentaje bajo 1,80 m','Fecha de exportación'],
      ...values.map(d=>[d.name,d.total,d.below,String(d.pct??'').replace('.',','),manifest.generated_utc.slice(0,10)])];
    const blob=new Blob(['\uFEFF'+rows.map(row=>row.map(quote).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url;link.download='madrid-a-pie-comparacion-'+selected('a').id+'-'+selected('b').id+'.csv';
    document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  byId('compare-retry').addEventListener('click',loadManifest);

  function prepareData() {
    if (!manifest) return;
    const params=new URL(location.href).searchParams;
    slots.forEach((slot,i)=>{
      const select=byId('compare-'+slot),previous=select.value;
      select.replaceChildren(...manifest.districts.map(d=>new Option(d.name,String(d.id))));
      const requested=params.get(slot);
      select.value=districtInfo(requested)?requested:districtInfo(previous)?previous:(i===0?'6':'11');
      select.disabled=false;
    });
    ['swap-comparison','share-comparison','download-comparison'].forEach(id=>byId(id).disabled=false);
    byId('comparison-loading').hidden=true;byId('comparison-body').hidden=false;
    byId('compare-retry').hidden=true;renderComparison();
  }
  function restoreFromUrl() {
    if (restored || !manifest || !districtMap || !boundaryData) return;
    restored=true;
    districtMap.on('movestart',()=>{byId('map-share-status').textContent='';byId('map-share-link').hidden=true;});
    byId('share-map').disabled=false;byId('map-view-toggle').disabled=false;
    slots.forEach(slot=>byId('compare-'+slot+'-map').disabled=false);
    const params=new URL(location.href).searchParams,id=params.get('d');
    if (id!=='city' && !districtInfo(id)) return;
    const raw=['lat','lng','z'].map(key=>params.get(key));
    const [lat,lng,zoom]=raw.map(Number);
    const validView=raw.every(v=>v!==null&&v.trim()!=='') && [lat,lng,zoom].every(Number.isFinite) && Math.abs(lat)<=85 && Math.abs(lng)<=180 && zoom>=8 && zoom<=20;
    openDistrictMap(id,{fit:!validView});
    if(validView){
      districtMap.stop();districtMap.setView([lat,lng],zoom,{animate:false,reset:true});
    }
  }
  document.addEventListener('madrid:data',prepareData);
  document.addEventListener('madrid:mapready',restoreFromUrl);
  document.addEventListener('madrid:dataerror',()=>{
    byId('comparison-loading').textContent='No se han podido cargar los datos de la comparación.';
    byId('compare-retry').hidden=false;
  });
  if(manifest)prepareData();
  restoreFromUrl();
})();
