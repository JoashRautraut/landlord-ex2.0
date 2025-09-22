// Add Supabase client initialization
// Replace with your actual values from the Supabase dashboard

const SUPABASE_URL = 'https://ozkxzvpiiqhhzbyzetsy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96a3h6dnBpaXFoaHpieXpldHN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMjcwMTksImV4cCI6MjA2NjYwMzAxOX0.ra2xvmu97bESlkHkwvPIKjbbccJbQYyHbbFzbJXa4sU';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// Expose globally so inline scripts (e.g., in home.html) can use the same client
window.supabaseClient = supabase;

document.addEventListener('DOMContentLoaded', () => {
    const title_el = document.getElementById('title');
    if (window.api && window.api.title) {
        title_el.innerText = window.api.title;
    }
});

// Fetch users from Supabase and populate the user management table
document.addEventListener('DOMContentLoaded', () => {
  fetchAndRenderUsers();
  updateDashboardCounts();
  // Event delegation for action buttons (guard if table exists on this page)
  const usersTbodyEl = document.querySelector('#profile .account-table tbody');
  if (usersTbodyEl) usersTbodyEl.addEventListener('click', async function(e) {
    // Deactivate/Activate
    if (e.target.closest('.deactivate')) {
      const btn = e.target.closest('.deactivate');
      const row = btn.closest('tr');
      const userId = row.getAttribute('data-user-id');
      if (!userId) return alert('User not found');
      // Get current status
      const users = await getUsers();
      const user = users.find(u => String(u.user_id) === String(userId));
      if (!user) return alert('User not found');
      const newStatus = !user.active;
      const { error } = await supabase
        .from('users')
        .update({ active: newStatus })
        .eq('user_id', user.user_id);
      if (error) return alert('Failed to update status');
      fetchAndRenderUsers();
    }
    // Edit
    if (e.target.closest('.edit')) {
      const btn = e.target.closest('.edit');
      const row = btn.closest('tr');
      const userId = row.getAttribute('data-user-id');
      if (!userId) return alert('User not found');
      const users = await getUsers();
      const user = users.find(u => String(u.user_id) === String(userId));
      if (!user) return alert('User not found');
      // Populate modal fields (example: you can add more fields as needed)
      document.getElementById('edit-user-modal').classList.add('active');
      document.getElementById('edit-user-id').value = user.user_id;
      document.getElementById('edit-user-firstname').value = user.user_firstname || '';
      document.getElementById('edit-user-lastname').value = user.user_lastname || '';
      document.getElementById('edit-user-role').value = user.role || '';
      document.getElementById('edit-user-email').value = user.user_email || '';
    }
  });

  // Modal Save and Cancel functionality
  const modal = document.getElementById('edit-user-modal');
  if (modal) {
    // Cancel button
    modal.querySelector('.modal-btn.cancel').onclick = function() {
      modal.classList.remove('active');
    };
    // Save button
    modal.querySelector('.modal-btn.save').onclick = async function() {
      const user_id = modal.querySelector('#edit-user-id').value;
      const user_firstname = modal.querySelector('#edit-user-firstname').value;
      const user_lastname = modal.querySelector('#edit-user-lastname').value;
      const user_email = modal.querySelector('#edit-user-email').value;
      const { error } = await supabase
        .from('users')
        .update({
          user_firstname,
          user_lastname,
          user_email
        })
        .eq('user_id', user_id);
      if (error) {
        alert('Failed to update user: ' + error.message);
        return;
      }
      modal.classList.remove('active');
      fetchAndRenderUsers();
    };
    // Close button
    const closeBtn = document.getElementById('close-edit-modal');
    if (closeBtn) {
      closeBtn.onclick = function() {
        modal.classList.remove('active');
      };
    }
    // Live avatar preview
    const avatarInput = document.getElementById('edit-user-avatar');
    const avatarPreview = document.getElementById('edit-user-avatar-preview');
    if (avatarInput && avatarPreview) {
      avatarInput.addEventListener('input', function() {
        avatarPreview.src = avatarInput.value || 'https://randomuser.me/api/portraits/lego/1.jpg';
      });
    }
  }
});

async function getUsers() {
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .order('user_id', { ascending: true });
  return users || [];
}

async function fetchAndRenderUsers() {
  const tableBody = document.querySelector('#profile .account-table tbody');
  if (!tableBody) return;
  tableBody.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';

  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .order('user_id', { ascending: true });

  if (error) {
    tableBody.innerHTML = `<tr><td colspan="4">Error loading users.</td></tr>`;
    return;
  }
  if (!users || users.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="4">No users found.</td></tr>`;
    return;
  }

  tableBody.innerHTML = users.map(user => `
    <tr data-user-id="${user.user_id}">
      <td>
        <img class="user-avatar" src="${user.user_avatar_url || 'https://randomuser.me/api/portraits/lego/1.jpg'}" alt="avatar">
        ${user.user_firstname || ''} ${user.user_lastname || ''}
      </td>
      <td>${user.role || ''}</td>
      <td>
        <span class="status-dot ${user.active !== false ? 'active' : 'deactivated'}"></span>
        ${user.active !== false ? 'Active' : 'Deactivated'}
      </td>
      <td>
        <button class="action-btn edit"><span class="action-icon edit"></span> Edit</button>
        <button class="action-btn deactivate${user.active !== false ? '' : ' active'}"><span class="action-icon deactivate"></span> ${user.active !== false ? 'Deactivate' : 'Activate'}</button>
      </td>
    </tr>
  `).join('');
}

function navigateTo(sectionId) {
    document.querySelectorAll('.container').forEach(section => {
        section.style.display = 'none';
    });
    document.getElementById(sectionId).style.display = 'block';

    // Set background color based on section
    if (sectionId === 'map') {
        document.body.style.background = '#eaeaea'; // or #fff for a neutral background
    } else {
        document.body.style.background = 'rgb(255, 78, 0)';
    }
}

// Initial navigation to the profile page
navigateTo('map');

// Function to accept work and move the post to the Workspace section
function acceptWork(button) {
    // Find the post element that contains the button clicked
    const post = button.closest('.post');

    // Clone the entire post element, including the image
    const clonedPost = post.cloneNode(true);

    // Remove the "Accept Work" button in the cloned post
    const acceptButton = clonedPost.querySelector('.accept-btn');
    if (acceptButton) {
        acceptButton.remove();
    }

    // Create a new list item and append the cloned post to it
    const listItem = document.createElement('li');
    listItem.appendChild(clonedPost);

    // Append the list item to the accepted jobs list in the workspace section
    const acceptedJobsList = document.getElementById('accepted-jobs-list');
    if (acceptedJobsList) {
        acceptedJobsList.appendChild(listItem);
    } else {
        console.error("Workspace section or accepted-jobs-list not found in the HTML.");
    }

    // Optionally, hide the original post from the home section
    post.style.display = 'none';

    // Navigate to the workspace section to show the accepted post
    navigateTo('workspace');
}

// Function to navigate to different sections (home, profile, workspace)
function navigateTo(sectionId) {
    document.querySelectorAll('main, section').forEach(section => {
        section.style.display = section.id === sectionId ? 'block' : 'none';
    });
}
        // Function to navigate between sections
        function navigateTo(sectionId) {
            document.querySelectorAll('.container').forEach(section => {
                section.style.display = 'none';
            });
            document.getElementById(sectionId).style.display = 'block';
        }

        // Function to show the logout confirmation dialog
        function showLogoutConfirmation() {
            document.getElementById('logout-confirmation').style.display = 'block';
        }

        // Function to hide the logout confirmation dialog
        function hideLogoutConfirmation() {
            document.getElementById('logout-confirmation').style.display = 'none';
        }

        // Function to log out and redirect to the log-in page
        function logout() {
            window.location.href = 'index.html'; // Redirect to login page
        }

async function updateDashboardCounts() {
  // Total users
  const { count: userCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  // Total land areas
  const { count: landAreaCount, data: landAreas } = await supabase
    .from('land_areas')
    .select('id', { count: 'exact' });

  // Total unique landowners (by id in land_areas)
  let landownerCount = 0;
  if (landAreas) {
    const uniqueOwners = new Set(landAreas.map(area => area.id));
    landownerCount = uniqueOwners.size;
  }

  // Update the dashboard
  const usersElem = document.getElementById('total-users');
  const ownersElem = document.getElementById('total-landowners');
  const areasElem = document.getElementById('total-landareas');
  if (usersElem) usersElem.textContent = userCount ?? '0';
  if (ownersElem) ownersElem.textContent = landownerCount ?? '0';
  if (areasElem) areasElem.textContent = landAreaCount ?? '0';
}

// Call this on DOMContentLoaded
const origDOMContentLoaded = document.onreadystatechange;
document.addEventListener('DOMContentLoaded', () => {
  updateDashboardCounts();
  if (typeof origDOMContentLoaded === 'function') origDOMContentLoaded();
  // ... your other code ...
  // If Reports page opens initially with Map Records tab, attempt render
  setupMapRecordsReportRendering();
});

let leafletMap = null;

// Global Manolo Fortich bounds - use this consistently throughout the app
const MANOLO_FORTICH_BOUNDS = L.latLngBounds(
  [8.0000, 124.5000], // southwest corner
  [8.7000, 125.3000]  // northeast corner
);

// Global function to force map back to Manolo Fortich bounds
window.forceMapToManoloFortich = function() {
  if (window.leafletMap) {
    window.leafletMap.setMaxBounds(MANOLO_FORTICH_BOUNDS);
    window.leafletMap.fitBounds(MANOLO_FORTICH_BOUNDS);
    window.leafletMap.setView([8.35, 124.9], 12);
  }
};

function initMap() {
  const mapContainer = document.getElementById('mapid');
  if (!mapContainer) return;
  // If an external map iframe is present, skip local Leaflet init
  if (document.getElementById('map-embed')) return;

  // Properly destroy any previous map instance
  if (window.leafletMap) {
    window.leafletMap.remove();
    window.leafletMap = null;
  }
  mapContainer.innerHTML = '';

  // Use global Manolo Fortich bounds

  // Initialize map with Manolo Fortich center and appropriate zoom
  var map = L.map('mapid', {
    center: [8.35, 124.9], // Center of Manolo Fortich
    zoom: 9, // zoomed out to show more area
    maxBounds: MANOLO_FORTICH_BOUNDS,
    maxBoundsViscosity: 0.01, // very flexible bounds
    minZoom: 5, // allow more zoom out
    maxZoom: 20,
    worldCopyJump: false, // Prevent world wrapping
    zoomControl: true
  });
  window.leafletMap = map;

  // Force the map to stay within bounds immediately
  map.setMaxBounds(MANOLO_FORTICH_BOUNDS);
  map.fitBounds(MANOLO_FORTICH_BOUNDS);
  
  // Allow flexible map movement within the larger bounds
  // Removed strict bounds enforcement to allow better navigation

  // TEST: Add a simple map click popup to verify popups work
  // REMOVE this after debugging so only land area clicks show popups
  // map.on('click', function(e) {
  //   L.popup()
  //     .setLatLng(e.latlng)
  //     .setContent('Test popup at ' + e.latlng.lat + ', ' + e.latlng.lng)
  //     .openOn(map);
  // });

  // Ensure the map container is sized and visible before using popups
  setTimeout(() => {
    if (window.leafletMap) window.leafletMap.invalidateSize();
  }, 200);

  // Add zoomToLandArea event handler
  window.addEventListener('zoomToLandArea', function(e) {
    const area = e.detail;
    if (!area || !area.path) return;
    let coords = area.path;
    if (typeof coords === 'string') {
      try { coords = JSON.parse(coords); } catch {}
    }
    if (Array.isArray(coords) && coords.length > 0) {
      if (Array.isArray(coords[0])) {
        // Strictly filter and correct coordinates
        let correctedCoords = coords
          .map(pt => {
            if (!pt || pt.length < 2) return null;
            let lat = pt[0], lng = pt[1];
            if (typeof lat !== 'number' || typeof lng !== 'number') return null;
            if (lat > 90 || lat < -90) [lat, lng] = [lng, lat];
            return [lat, lng];
          })
          .filter(pt => pt && !isNaN(pt[0]) && !isNaN(pt[1]));
        // Remove duplicate last point if same as first
        if (
          correctedCoords.length > 2 &&
          correctedCoords[0][0] === correctedCoords[correctedCoords.length - 1][0] &&
          correctedCoords[0][1] === correctedCoords[correctedCoords.length - 1][1]
        ) {
          correctedCoords.pop();
        }
        console.log('Original coords:', coords);
        console.log('fitBounds will use:', JSON.stringify(correctedCoords));
        correctedCoords.forEach((pt, idx) => {
          if (!Array.isArray(pt) || pt.length !== 2 || isNaN(pt[0]) || isNaN(pt[1])) {
            console.error('Invalid point at index', idx, pt);
          }
        });
        if (correctedCoords.length > 1) {
          if (map && map.invalidateSize) map.invalidateSize();
          map.fitBounds(correctedCoords);
          if (window._highlightLayer) map.removeLayer(window._highlightLayer);
          window._highlightLayer = L.polygon(correctedCoords, {color: 'red', weight: 3, fillOpacity: 0.15}).addTo(map);
        } else {
          console.error('Not enough valid points for fitBounds:', correctedCoords);
        }
      } else if (typeof coords[0] === 'number') {
        let lat = coords[0], lng = coords[1];
        if (lat > 90 || lat < -90) [lat, lng] = [lng, lat];
        if (!isNaN(lat) && !isNaN(lng)) {
          if (map && map.invalidateSize) map.invalidateSize();
          map.setView([lat, lng], 16);
          if (window._highlightLayer) map.removeLayer(window._highlightLayer);
          window._highlightLayer = L.marker([lat, lng]).addTo(map);
        } else {
          console.error('Invalid single point for setView:', coords);
        }
      }
    }
  });

  // Set soft bounds once without aggressive re-enforcement
  setTimeout(() => {
    map.setMaxBounds(MANOLO_FORTICH_BOUNDS);
    map.fitBounds(MANOLO_FORTICH_BOUNDS);
    // Keyboard shortcut remains available
    document.addEventListener('keydown', function(e) {
      if (e.ctrlKey && e.key === 'm') {
        e.preventDefault();
        window.forceMapToManoloFortich();
      }
    });
  }, 100);
  // Google Satellite base layer
  L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
    attribution: 'Tiles © Google — Source: Google Earth',
    maxZoom: 20
  }).addTo(map);

  // Google Hybrid layer for labels (roads, landmarks, place names)
  L.tileLayer('https://mt1.google.com/vt/lyrs=h&x={x}&y={y}&z={z}', {
    attribution: 'Labels © Google',
    opacity: 0.8,
    pane: 'overlayPane'
  }).addTo(map);
  // Draw land areas from the database
  drawLandAreas(map);
}

// === Heatmap Helper Functions ===
// Generate N random points inside a polygon (bounding box rejection sampling)
function randomPointsInPolygon(polygon, n) {
  const lats = polygon.map(pt => pt[0]);
  const lngs = polygon.map(pt => pt[1]);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  function pointInPoly(pt, poly) {
    let x = pt[1], y = pt[0];
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      let xi = poly[i][1], yi = poly[i][0];
      let xj = poly[j][1], yj = poly[j][0];
      let intersect = ((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / ((yj - yi) + 0.0000001) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }
  const points = [];
  let tries = 0;
  while (points.length < n && tries < n * 20) {
    const lat = minLat + Math.random() * (maxLat - minLat);
    const lng = minLng + Math.random() * (maxLng - minLng);
    if (pointInPoly([lat, lng], polygon)) {
      points.push([lat, lng]);
    }
    tries++;
  }
  return points;
}
// Calculate slope for each point (difference with nearest neighbor)
function calculateSlope(points, elevations) {
  const slopePoints = [];
  for (let i = 0; i < points.length; i++) {
    let minDist = Infinity, neighborIdx = -1;
    for (let j = 0; j < points.length; j++) {
      if (i === j) continue;
      const d = Math.sqrt(
        Math.pow(points[i][0] - points[j][0], 2) +
        Math.pow(points[i][1] - points[j][1], 2)
      );
      if (d < minDist) {
        minDist = d;
        neighborIdx = j;
      }
    }
    const slope = Math.abs(elevations[i] - elevations[neighborIdx]);
    slopePoints.push([points[i][0], points[i][1], slope]);
  }
  return slopePoints;
}

async function drawLandAreas(map) {
  // Fetch land areas (required)
  const { data: landAreas, error: landError } = await supabase
    .from('land_areas')
    .select('*');
  if (landError) {
    console.error('Error fetching land areas:', landError);
    return;
  }
  // Fetch owners and users (best-effort)
  let owners = [];
  let users = [];
  try {
    const ownersRes = await supabase
    .from('owners')
    .select('name, land_area_id, user_id');
    if (!ownersRes.error) owners = ownersRes.data || [];
    else console.warn('Owners fetch failed, continuing without owners:', ownersRes.error);
  } catch (e) { console.warn('Owners fetch exception:', e); }
  try {
    const usersRes = await supabase
    .from('users')
    .select('user_id, user_firstname, user_lastname, user_email');
    if (!usersRes.error) users = usersRes.data || [];
    else console.warn('Users fetch failed, continuing without users:', usersRes.error);
  } catch (e) { console.warn('Users fetch exception:', e); }
  landAreas.forEach(area => {
    let coords = area.path;
    if (typeof coords === 'string') {
      try { coords = JSON.parse(coords); } catch { return; }
    }
    // If Supabase returned JSON (object), it will already be parsed; ensure it's array
    if (!Array.isArray(coords)) return;
    if (!Array.isArray(coords) || coords.length === 0) return;
    // Normalize coords to array of [lat, lng]
    if (Array.isArray(coords) && coords.length && !Array.isArray(coords[0]) && coords[0] && typeof coords[0].lat === 'number') {
      coords = coords.map(p => [p.lat, p.lng]);
    }
    // Find the owner for this land area
    const owner = owners.find(o => o.land_area_id === area.id);
    const ownerName = owner?.name || 'Unknown Owner';
    // Find the user who added this owner
    let addedBy = 'Unknown User';
    if (owner && owner.user_id) {
      const user = users.find(u => u.user_id === owner.user_id);
      if (user) {
        addedBy = `${user.user_firstname || ''} ${user.user_lastname || ''}`.trim();
        if (!addedBy) addedBy = user.user_email;
      }
    }
    // Draw the polygon outline (always green)
    if (coords.length >= 3) {
      // Main polygon with fill (clickable)
      const polygon = L.polygon(coords, {
        color: 'green',
        fillOpacity: 0.1
      }).addTo(map);
      // Attach click handler to this polygon
      polygon.on('click', function(e) {
        showOwnerProfilePopup(area, coords, map, e && e.latlng);
      });
      // Removed heatmap overlay for slope inside polygons
    }
    // Draw mohon points (circle markers) at each vertex (white color)
    coords.forEach((pt, idx) => {
      // Support either [lat, lng] arrays or {lat, lng} objects
      let latLng = null;
      if (Array.isArray(pt) && pt.length === 2 && typeof pt[0] === 'number' && typeof pt[1] === 'number') {
        latLng = pt;
      } else if (pt && typeof pt.lat === 'number' && typeof pt.lng === 'number') {
        latLng = [pt.lat, pt.lng];
      }
      if (latLng) {
        const marker = L.circleMarker(latLng, {
          radius: 8,
          color: '#fff',
          fillColor: '#fff',
          fillOpacity: 1,
          weight: 2,
          opacity: 1
        }).addTo(map);
        // Compute NE and distance from the reference origin for each vertex
        const ne = distanceFromReferenceOrigin(latLng[0], latLng[1]);
        marker.bindPopup(
          `<b>Owner:</b> ${ownerName}` +
          `<br><b>Added by:</b> ${addedBy}` +
          `<br><b>Point:</b> ${latLng[0]}, ${latLng[1]}` +
          `<br><b>${referenceOrigin.name} distance:</b> ${ne.distance.toFixed(2)} m` +
          `<br><b>From ${referenceOrigin.name} (N/E):</b> ${ne.northing.toFixed(2)} m / ${ne.easting.toFixed(2)} m`
        );
      }
    });
  });
}

async function fetchAndRenderActivityLogs() {
  const tableBody = document.querySelector('#workspace .activity-log-table tbody');
  if (!tableBody) return;
  tableBody.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';
  const { data: logs, error } = await supabase
    .from('activity_logs')
    .select('*')
    .order('timestamp', { ascending: false });
  if (error) {
    tableBody.innerHTML = `<tr><td colspan="4">Error loading logs.</td></tr>`;
    return;
  }
  if (!logs || logs.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="4">No logs found.</td></tr>`;
    return;
  }
  tableBody.innerHTML = logs.map(log => `
    <tr>
      <td>${log.operation_name || ''}</td>
      <td><span class="log-status succeeded">${log.status || ''}</span></td>
      <td>${log.time || ''}</td>
      <td>${log.timestamp || ''}</td>
    </tr>
  `).join('');
}

// Patch navigation to update data and map
var origNav = window.navigateTo;
window.navigateTo = function(sectionId) {
  if (origNav) origNav(sectionId);
  if (sectionId === 'home') {
    if (typeof updateDashboardCounts === 'function') updateDashboardCounts();
    // Re-render map records when returning to reports
    setupMapRecordsReportRendering();
  }
  if (sectionId === 'profile') {
    if (typeof fetchAndRenderUsers === 'function') fetchAndRenderUsers();
  }
  if (sectionId === 'workspace') {
    if (typeof fetchAndRenderActivityLogs === 'function') fetchAndRenderActivityLogs();
  }
  if (sectionId === 'map') {
    const mapMain = document.getElementById('map');
    if (mapMain) mapMain.style.display = 'block';
    // Initialize map only once
    if (!window.leafletMap) {
      requestAnimationFrame(() => {
        initMap();
        setTimeout(() => { window.forceMapToManoloFortich(); }, 200);
      });
    } else {
      // Just invalidate size when showing again
      setTimeout(() => { window.leafletMap && window.leafletMap.invalidateSize(); }, 100);
    }
  }
};

// Add Technician Modal logic
function showAddTechnicianModal() {
  document.getElementById('add-technician-modal').classList.add('active');
}
function hideAddTechnicianModal() {
  document.getElementById('add-technician-modal').classList.remove('active');
  document.getElementById('add-tech-firstname').value = '';
  document.getElementById('add-tech-lastname').value = '';
  document.getElementById('add-tech-email').value = '';
}
document.addEventListener('DOMContentLoaded', function() {
  var addBtn = document.getElementById('add-technician-btn');
  if (addBtn) {
    addBtn.onclick = showAddTechnicianModal;
  }
  var closeBtn = document.getElementById('close-add-technician-modal');
  if (closeBtn) {
    closeBtn.onclick = hideAddTechnicianModal;
  }
  var cancelBtn = document.getElementById('cancel-add-technician');
  if (cancelBtn) {
    cancelBtn.onclick = hideAddTechnicianModal;
  }
  var saveBtn = document.getElementById('save-add-technician');
  if (saveBtn) {
    saveBtn.onclick = async function() {
      const firstname = document.getElementById('add-tech-firstname').value.trim();
      const lastname = document.getElementById('add-tech-lastname').value.trim();
      const email = document.getElementById('add-tech-email').value.trim();
      if (!firstname || !lastname || !email) {
        alert('Please fill in all fields.');
        return;
      }
      // Username is the part before the @ in email
      const username = email.split('@')[0];
      const user_password = 'landlord';
      const { error } = await supabase.from('users').insert([
        {
          username,
          user_email: email,
          user_firstname: firstname,
          user_lastname: lastname,
          user_password,
          role: 'technician'
        }
      ]);
      if (error) {
        alert('Failed to add technician: ' + error.message);
        return;
      }
      hideAddTechnicianModal();
      fetchAndRenderUsers();
    };
  }
});        

// Land Area Panel Logic
async function fetchAndRenderLandAreas() {
  // Fetch all land areas
  const { data: landAreas, error: landError } = await supabase
    .from('land_areas')
    .select('*');
  if (landError) {
    const countEl = document.getElementById('landarea-count');
    const listEl = document.getElementById('landarea-list');
    if (countEl) countEl.textContent = 'Land Areas: Error';
    if (listEl) listEl.innerHTML = '<li>Error loading land areas</li>';
    return;
  }
  const countEl = document.getElementById('landarea-count');
  const listLegacy = document.getElementById('landarea-list');
  const listWorkable = document.getElementById('landarea-list-workable');
  const listProblem = document.getElementById('landarea-list-problematic');
  if (!countEl || (!listLegacy && !(listWorkable && listProblem))) {
    // Panel not in DOM (e.g., not on map screen); bail quietly
    return;
  }
  countEl.textContent = `Land Holdings: ${landAreas.length}`;
  if (listLegacy) listLegacy.innerHTML = '';
  if (listWorkable) listWorkable.innerHTML = '';
  if (listProblem) listProblem.innerHTML = '';
  landAreas.forEach((area, idx) => {
    // Prefer name from land_areas when available
    const ownerName = (area.lo_name && String(area.lo_name).trim()) || `Land ${idx + 1}`;
    const landStatus = area.land_status || 'workable';
    const statusIcon = landStatus === 'problematic' ? '⚠️' : '✅';
    const statusText = landStatus === 'problematic' ? 'Problematic' : 'Workable';
    
    const li = document.createElement('li');
    li.style.cssText = `
      padding: 1rem;
      margin-bottom: 0.5rem;
      background: white;
      border: 1px solid var(--neutral-200);
      border-radius: var(--radius);
      box-shadow: var(--shadow-sm);
      cursor: pointer;
      transition: all 0.2s ease;
      list-style: none;
    `;
    
    li.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div style="flex: 1;">
          <div style="font-weight: 600; color: var(--neutral-800); margin-bottom: 0.25rem;">${ownerName}</div>
          <div style="font-size: 0.75rem; color: var(--neutral-500);">${area.barangay_name || 'No barangay specified'}</div>
        </div>
        <div class="${landStatus === 'problematic' ? 'status-problematic' : 'status-workable'}">
          ${statusIcon} ${statusText}
        </div>
      </div>
    `;
    
    // Add hover effect
    li.addEventListener('mouseenter', () => {
      li.style.transform = 'translateY(-1px)';
      li.style.boxShadow = 'var(--shadow-md)';
      li.style.borderColor = 'var(--primary)';
    });
    
    li.addEventListener('mouseleave', () => {
      li.style.transform = 'translateY(0)';
      li.style.boxShadow = 'var(--shadow-sm)';
      li.style.borderColor = 'var(--neutral-200)';
    });
    li.onclick = function() {
      if (window.zoomToLandArea) {
        window.zoomToLandArea(area);
      } else {
        const event = new CustomEvent('zoomToLandArea', { detail: area });
        window.dispatchEvent(event);
      }
      document.querySelectorAll('.landarea-list li').forEach(el => el.classList.remove('active'));
      li.classList.add('active');
      setTimeout(() => {
        const map = window.leafletMap;
        let coords = area.path;
        if (typeof coords === 'string') {
          try { coords = JSON.parse(coords); } catch {}
        }
        // Normalize coords to arrays for center calculation
        if (Array.isArray(coords) && coords.length && !Array.isArray(coords[0]) && coords[0] && typeof coords[0].lat === 'number') {
          coords = coords.map(p => [p.lat, p.lng]);
        }
        let popupLatLng = null;
        if (Array.isArray(coords) && coords.length > 0 && Array.isArray(coords[0])) {
          let latSum = 0, lngSum = 0, count = 0;
          coords.forEach(pt => {
            if (Array.isArray(pt) && pt.length === 2 && !isNaN(pt[0]) && !isNaN(pt[1])) {
              latSum += pt[0]; lngSum += pt[1]; count++;
            }
          });
          if (count > 0) popupLatLng = L.latLng(latSum / count, lngSum / count);
        }
        if (typeof showOwnerProfilePopup === 'function') {
          showOwnerProfilePopup(area, coords, map, popupLatLng);
        }
      }, 400);
    };
    if (listWorkable && listProblem) {
      const status = (landStatus || 'workable').toLowerCase();
      if (status === 'problematic') listProblem.appendChild(li); else listWorkable.appendChild(li);
    } else if (listLegacy) {
      listLegacy.appendChild(li);
    }
  });
  // Tabs toggle
  const tabWorkable = document.getElementById('land-tab-workable');
  const tabProblem = document.getElementById('land-tab-problematic');
  if (tabWorkable && tabProblem && listWorkable && listProblem) {
    const activate = (key) => {
      if (key === 'workable') {
        listWorkable.style.display = '';
        listProblem.style.display = 'none';
        tabWorkable.classList.add('ll-btn-primary');
        tabProblem.classList.remove('ll-btn-primary');
      } else {
        listWorkable.style.display = 'none';
        listProblem.style.display = '';
        tabProblem.classList.add('ll-btn-primary');
        tabWorkable.classList.remove('ll-btn-primary');
      }
    };
    tabWorkable.onclick = () => activate('workable');
    tabProblem.onclick = () => activate('problematic');
    activate('workable');
  }
}
// Panel collapse/expand

// Survey Points functionality
const addBearingBtn = document.getElementById('add-bearing-btn');
const bearingsModal = document.getElementById('bearings-modal');
const closeBearingsModal = document.getElementById('close-bearings-modal');
const addPointBtn = document.getElementById('add-point-btn');
const pointInputSection = document.querySelector('.point-input-section');
const addPointToTableBtn = document.getElementById('add-point-to-table-btn');
const cancelPointBtn = document.getElementById('cancel-point-btn');
const loadSampleDataBtn = document.getElementById('load-sample-data-btn');
const addSurveyToMapBtn = document.getElementById('add-survey-to-map-btn');
const cancelBearingBtn = document.getElementById('cancel-bearing-btn');

// Initialize survey data
let surveyPoints = [];
let bearings = [];
let bearingMarkers = [];

// Removed tie line dependency. Survey will use a fixed geographic reference origin only.

// Add bearing functionality
if (addBearingBtn) {
  addBearingBtn.onclick = function() {
    showBearingsModal();
  };
}

// Modal functionality
if (closeBearingsModal) {
  closeBearingsModal.onclick = function() {
    hideBearingsModal();
  };
}

if (cancelBearingBtn) {
  cancelBearingBtn.onclick = function() {
    hideBearingsModal();
  };
}

// Point management
if (addPointBtn) {
  addPointBtn.onclick = function() {
    showPointInput();
  };
}

if (addPointToTableBtn) {
  addPointToTableBtn.onclick = function() {
    addPointToTable();
  };
}

if (cancelPointBtn) {
  cancelPointBtn.onclick = function() {
    hidePointInput();
  };
}

if (loadSampleDataBtn) {
  loadSampleDataBtn.onclick = function() {
    loadSampleData();
  };
}

if (addSurveyToMapBtn) {
  addSurveyToMapBtn.onclick = function() {
    addSurveyToMap();
  };
}

// Close modal when clicking outside
if (bearingsModal) {
  bearingsModal.onclick = function(e) {
    if (e.target === bearingsModal) {
      hideBearingsModal();
    }
  };
}

// Initialize Tie Line System
// No tie line initialization needed; survey uses a fixed geographic reference origin only

// Convert degrees to radians
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

// Convert radians to degrees
function toDegrees(radians) {
  return radians * (180 / Math.PI);
}

// === Local tangent plane (northing/easting) from lat/lon ===
const EARTH_RADIUS_M = 6371000;

// Default origin: Lingi-on (Tie Line Start)
const referenceOrigin = { lat: 8.400, lng: 124.883, name: 'Lingi-on' };

// Convert lat/lon to local Northing/Easting (meters) relative to origin
function latLonToNE(lat, lng, lat0, lng0) {
  const dPhi = toRadians(lat - lat0);
  const dLam = toRadians(lng - lng0);
  const phiBar = toRadians((lat + lat0) / 2);
  const northing = EARTH_RADIUS_M * dPhi;
  const easting = EARTH_RADIUS_M * Math.cos(phiBar) * dLam;
  return { northing, easting };
}

// Convenience: compute NE and planar distance from the reference origin
function distanceFromReferenceOrigin(lat, lng) {
  const { northing, easting } = latLonToNE(lat, lng, referenceOrigin.lat, referenceOrigin.lng);
  const distance = Math.hypot(northing, easting);
  return { northing, easting, distance };
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Transform survey coordinates to lat/lng using Tie Line method
function transformSurveyToLatLng(easting, northing) {
  // Use the starting easting/northing as the local origin in meters,
  // and anchor it to a fixed geographic reference origin (referenceOrigin)
  const startE = parseFloat(document.getElementById('starting-easting').value.replace(/[^\d.-]/g, '')) || 20000;
  const startN = parseFloat(document.getElementById('starting-northing').value.replace(/[^\d.-]/g, '')) || 20000;

  const deltaEasting = easting - startE;
  const deltaNorthing = northing - startN;

  const distance = Math.sqrt(deltaEasting * deltaEasting + deltaNorthing * deltaNorthing);
  let azimuth = Math.atan2(deltaEasting, deltaNorthing) * (180 / Math.PI);
  if (azimuth < 0) azimuth += 360;

  const latScale = 1 / 111320; // meters per degree latitude (approx)
  const lngScale = 1 / (111320 * Math.cos(toRadians(referenceOrigin.lat))); // meters per degree longitude (approx)

  const lat = referenceOrigin.lat + (deltaNorthing * latScale);
  const lng = referenceOrigin.lng + (deltaEasting * lngScale);

  return { lat, lng, distance, azimuth };
}

function transformLatLngToSurvey(lat, lng) {
  // Inverse transformation from lat/lng to survey coordinates
  const deltaLat = lat - coordinateSystem.refLat;
  const deltaLng = lng - coordinateSystem.refLng;
  
  const northing = coordinateSystem.refNorthing + (deltaLat / coordinateSystem.scale);
  const easting = coordinateSystem.refEasting + (deltaLng / coordinateSystem.scale);
  
  return { easting, northing };
}

// Function to calculate polygon area using shoelace formula
function calculatePolygonArea(points) {
  if (points.length < 3) return 0;
  
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].lat * points[j].lng;
    area -= points[j].lat * points[i].lng;
  }
  
  // Convert to square meters using proper scaling for Manolo Fortich area
  const refLat = referenceOrigin.lat * Math.PI / 180; // Convert to radians
  const latScale = 111320; // meters per degree latitude
  const lngScale = 111320 * Math.cos(refLat); // meters per degree longitude
  
  return Math.abs(area) * 0.5 * latScale * lngScale;
}

function showBearingsModal() {
  if (bearingsModal) {
    bearingsModal.classList.add('active');
    // Ensure starting values exist; otherwise set sensible defaults
    if (!document.getElementById('starting-easting').value) document.getElementById('starting-easting').value = '20000.000';
    if (!document.getElementById('starting-northing').value) document.getElementById('starting-northing').value = '20000.000';
    // Reset LO name field state
    const loInput = document.getElementById('lo-name-input');
    if (loInput) loInput.value = (loInput.value || '').trim();
    // Clear table and reset data
    surveyPoints = [];
    updatePointsTable();
    updateSummary();
    addSurveyToMapBtn.disabled = true;
  }
}

function hideBearingsModal() {
  if (bearingsModal) {
    bearingsModal.classList.remove('active');
    hidePointInput();
  }
}

function showPointInput() {
  if (pointInputSection) {
    pointInputSection.style.display = 'block';
    // Clear point inputs
    document.getElementById('point-northing').value = '';
    document.getElementById('point-easting').value = '';
  }
}

function hidePointInput() {
  if (pointInputSection) {
    pointInputSection.style.display = 'none';
  }
}

// Function to convert DMS to decimal degrees
function dmsToDecimal(degrees, minutes, seconds, direction, quadrant) {
  let decimal = degrees + (minutes / 60) + (seconds / 3600);
  
  // Convert bearing to azimuth based on quadrant
  if (direction === 'N' && quadrant === 'E') {
    // N43°02'E = 43.033°
    return decimal;
  } else if (direction === 'N' && quadrant === 'W') {
    // N43°02'W = 360° - 43.033° = 316.967°
    return 360 - decimal;
  } else if (direction === 'S' && quadrant === 'E') {
    // S43°02'E = 180° - 43.033° = 136.967°
    return 180 - decimal;
  } else if (direction === 'S' && quadrant === 'W') {
    // S43°02'W = 180° + 43.033° = 223.033°
    return 180 + decimal;
  }
  
  return decimal;
}

// Function to add point to table
function addPointToTable() {
  // Get input values and clean them
  const northingStr = document.getElementById('point-northing').value.replace(/[^\d.-]/g, '');
  const eastingStr = document.getElementById('point-easting').value.replace(/[^\d.-]/g, '');
  
  const northing = parseFloat(northingStr);
  const easting = parseFloat(eastingStr);
  
  // Validate inputs
  if (isNaN(northing) || isNaN(easting)) {
    alert('Please enter valid numbers for Northing and Easting.');
    return;
  }
  
  // Basic validation - ensure coordinates are reasonable numbers
  if (northing === 0 && easting === 0) {
    alert('Please enter valid coordinates (cannot be 0,0).');
    return;
  }
  
  // Get previous point for distance and bearing calculation
  let prevPoint;
  if (surveyPoints.length === 0) {
    prevPoint = {
      easting: parseFloat(document.getElementById('starting-easting').value),
      northing: parseFloat(document.getElementById('starting-northing').value)
    };
  } else {
    prevPoint = surveyPoints[surveyPoints.length - 1];
  }
  
  // Calculate distance and bearing
  const deltaE = easting - prevPoint.easting;
  const deltaN = northing - prevPoint.northing;
  const distance = Math.sqrt(deltaE * deltaE + deltaN * deltaN);
  
  // Calculate bearing (azimuth from north)
  let bearing = Math.atan2(deltaE, deltaN) * (180 / Math.PI);
  if (bearing < 0) bearing += 360;
  
  // Convert azimuth to bearing notation
  let bearingStr = '';
  if (bearing <= 90) {
    bearingStr = `N${bearing.toFixed(1)}°E`;
  } else if (bearing <= 180) {
    bearingStr = `S${(180 - bearing).toFixed(1)}°E`;
  } else if (bearing <= 270) {
    bearingStr = `S${(bearing - 180).toFixed(1)}°W`;
  } else {
    bearingStr = `N${(360 - bearing).toFixed(1)}°W`;
  }
  
  // Create point
  const point = {
    id: Date.now(),
    name: surveyPoints.length === 0 ? 'Point 1' : `Point ${surveyPoints.length + 1}`,
    northing: northing,
    easting: easting,
    distance: distance,
    bearing: bearingStr,
    azimuth: bearing
  };
  
  surveyPoints.push(point);
  
  // Update table and summary
  updatePointsTable();
  updateSummary();
  
  // Hide point input
  hidePointInput();
  
  // Enable add to map button if we have points
  if (surveyPoints.length > 0) {
    addSurveyToMapBtn.disabled = false;
  }
}

// Function to update points table
function updatePointsTable() {
  const tbody = document.getElementById('lines-tbody');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  surveyPoints.forEach((point, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="line-name">${point.name}</td>
      <td class="coordinate-display">${point.northing.toFixed(3)}</td>
      <td class="coordinate-display">${point.easting.toFixed(3)}</td>
      <td class="distance-display">${point.distance.toFixed(2)}</td>
      <td class="bearing-display">${point.bearing}</td>
      <td class="line-actions">
        <button class="line-action-btn edit" onclick="editPoint(${point.id})" title="Edit">✏️</button>
        <button class="line-action-btn delete" onclick="deletePoint(${point.id})" title="Delete">🗑️</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// Function to update summary
function updateSummary() {
  const totalPoints = surveyPoints.length;
  const totalDistance = surveyPoints.reduce((sum, point) => sum + point.distance, 0);
  
  document.getElementById('total-points').textContent = totalPoints;
  document.getElementById('total-distance').textContent = `${totalDistance.toFixed(2)} m`;
  
  // Calculate area if we have more than 2 points (using shoelace formula)
      if (surveyPoints.length > 2) {
      const startPoint = {
        easting: parseFloat(document.getElementById('starting-easting').value.replace(/[^\d.-]/g, '')),
        northing: parseFloat(document.getElementById('starting-northing').value.replace(/[^\d.-]/g, ''))
      };
      
      // Create array of all points including starting point and convert to lat/lng
      const allPoints = [startPoint, ...surveyPoints];
      const latLngPoints = allPoints.map(point => transformSurveyToLatLng(point.easting, point.northing));
      
      // Calculate area using lat/lng coordinates
      const area = calculatePolygonArea(latLngPoints);
      
      document.getElementById('total-area').textContent = `${area.toFixed(2)} m²`;
    } else {
      document.getElementById('total-area').textContent = '0.00 m²';
    }
  
  // Enable/disable add to map button
  if (addSurveyToMapBtn) {
    const loNameVal = (document.getElementById('lo-name-input')?.value || '').trim();
    addSurveyToMapBtn.disabled = totalPoints === 0 || loNameVal.length === 0;
    console.log('Add to Map button disabled:', addSurveyToMapBtn.disabled, 'Total points:', totalPoints);
  }
}

// Function to load sample data
function loadSampleData() {
  // Clear existing points
  surveyPoints = [];
  
  // Realistic sample data for Manolo Fortich, Bukidnon area
  // Based on typical land survey measurements in the Philippines
  const samplePoints = [
    { name: 'Point 1', northing: 20125.450, easting: 20089.320 },
    { name: 'Point 2', northing: 20098.780, easting: 20165.890 },
    { name: 'Point 3', northing: 20045.120, easting: 20142.650 },
    { name: 'Point 4', northing: 20072.340, easting: 20066.180 }
  ];
  
  samplePoints.forEach((data, index) => {
    // Get previous point for distance and bearing calculation
    let prevPoint;
    if (index === 0) {
      prevPoint = {
        easting: parseFloat(document.getElementById('starting-easting').value.replace(/[^\d.-]/g, '')),
        northing: parseFloat(document.getElementById('starting-northing').value.replace(/[^\d.-]/g, ''))
      };
    } else {
      prevPoint = surveyPoints[index - 1];
    }
    
    // Calculate distance and bearing
    const deltaE = data.easting - prevPoint.easting;
    const deltaN = data.northing - prevPoint.northing;
    const distance = Math.sqrt(deltaE * deltaE + deltaN * deltaN);
    
    // Calculate bearing (azimuth from north)
    let bearing = Math.atan2(deltaE, deltaN) * (180 / Math.PI);
    if (bearing < 0) bearing += 360;
    
    // Convert azimuth to bearing notation
    let bearingStr = '';
    if (bearing <= 90) {
      bearingStr = `N${bearing.toFixed(1)}°E`;
    } else if (bearing <= 180) {
      bearingStr = `S${(180 - bearing).toFixed(1)}°E`;
    } else if (bearing <= 270) {
      bearingStr = `S${(bearing - 180).toFixed(1)}°W`;
    } else {
      bearingStr = `N${(360 - bearing).toFixed(1)}°W`;
    }
    
    const point = {
      id: Date.now() + index,
      name: data.name,
      northing: data.northing,
      easting: data.easting,
      distance: distance,
      bearing: bearingStr,
      azimuth: bearing
    };
    
    surveyPoints.push(point);
  });
  
  updatePointsTable();
  updateSummary();
  addSurveyToMapBtn.disabled = false;
}

// Function to add survey to map
async function addSurveyToMap() {
  console.log('addSurveyToMap called');
  console.log('surveyPoints:', surveyPoints);
  console.log('window.leafletMap:', window.leafletMap);
  
  // Require LO name before proceeding
  const loName = (document.getElementById('lo-name-input')?.value || '').trim();
  if (!loName) {
    alert('Cannot save: please enter LO Name first.');
    return;
  }

  if (surveyPoints.length === 0) {
    alert('Please add at least one survey point before adding to map.');
    return;
  }

  if (!window.leafletMap) {
    alert('Map is not ready. Please wait a moment and try again.');
    return;
  }

  // Get starting point
  const startPoint = {
    easting: parseFloat(document.getElementById('starting-easting').value.replace(/[^\d.-]/g, '')),
    northing: parseFloat(document.getElementById('starting-northing').value.replace(/[^\d.-]/g, ''))
  };

  // Transform starting point to lat/lng using tie line method
  const startLatLng = transformSurveyToLatLng(startPoint.easting, startPoint.northing);
  
  // Add starting point marker
  const startMarker = L.marker(startLatLng, {
    icon: L.divIcon({
      className: 'custom-marker start-marker',
      html: '<div class="marker-content">S</div>',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    })
  }).addTo(window.leafletMap);
  
  // Add popup to starting point
  const startNE = distanceFromReferenceOrigin(startLatLng.lat, startLatLng.lng);
  startMarker.bindPopup(`
    <div class="marker-popup">
      <h4>Starting Point</h4>
      <p><strong>Easting:</strong> ${startPoint.easting.toFixed(3)}</p>
      <p><strong>Northing:</strong> ${startPoint.northing.toFixed(3)}</p>
      <p><strong>Latitude:</strong> ${startLatLng.lat.toFixed(6)}</p>
      <p><strong>Longitude:</strong> ${startLatLng.lng.toFixed(6)}</p>
      <p><strong>${referenceOrigin.name} distance:</strong> ${startNE.distance.toFixed(2)} m</p>
      <p><strong>From ${referenceOrigin.name} (N/E):</strong> ${startNE.northing.toFixed(2)} m / ${startNE.easting.toFixed(2)} m</p>
    </div>
  `);

  // Yellow traverse should NOT connect to the tie line; only connect between survey points
  let previousPoint = null;
  const allPoints = [];

  // Add each survey point
  surveyPoints.forEach((point, index) => {
    // Transform survey coordinates to lat/lng
    const pointLatLng = transformSurveyToLatLng(point.easting, point.northing);
    console.log(`Point ${index + 1}:`, {
      survey: { easting: point.easting, northing: point.northing },
      latLng: pointLatLng
    });
    allPoints.push(pointLatLng);
    
    // Add point marker
    const pointMarker = L.marker(pointLatLng, {
      icon: L.divIcon({
        className: 'custom-marker point-marker',
        html: `<div class="marker-content">${index + 1}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      })
    }).addTo(window.leafletMap);
    
    // Add popup to point
    const pointNE = distanceFromReferenceOrigin(pointLatLng.lat, pointLatLng.lng);
    pointMarker.bindPopup(`
      <div class="marker-popup">
        <h4>Point ${index + 1}</h4>
        <p><strong>Easting:</strong> ${point.easting.toFixed(3)}</p>
        <p><strong>Northing:</strong> ${point.northing.toFixed(3)}</p>
        <p><strong>Latitude:</strong> ${pointLatLng.lat.toFixed(6)}</p>
        <p><strong>Longitude:</strong> ${pointLatLng.lng.toFixed(6)}</p>
        <p><strong>Distance:</strong> ${point.distance.toFixed(2)} m</p>
        <p><strong>Bearing:</strong> ${point.bearing}</p>
        <p><strong>${referenceOrigin.name} distance:</strong> ${pointNE.distance.toFixed(2)} m</p>
        <p><strong>From ${referenceOrigin.name} (N/E):</strong> ${pointNE.northing.toFixed(2)} m / ${pointNE.easting.toFixed(2)} m</p>
      </div>
    `);
    
    // Draw line only between survey points (not from tie line)
    if (previousPoint) {
      const line = L.polyline([previousPoint, pointLatLng], {
        color: '#ffd600',
        weight: 3,
        opacity: 0.8
      }).addTo(window.leafletMap);
      
      // Add popup to line
      line.bindPopup(`
        <div class="marker-popup">
          <h4>Line ${index}</h4>
          <p><strong>Distance:</strong> ${point.distance.toFixed(2)} m</p>
          <p><strong>Bearing:</strong> ${point.bearing}</p>
        </div>
      `);
    }
    previousPoint = pointLatLng;
  });

  // Draw polygon if we have 3 or more points
  if (allPoints.length >= 2) {
    const polygon = L.polygon(allPoints, {
      color: '#ffd600',
      weight: 2,
      opacity: 0.8,
      fillColor: '#ffd600',
      fillOpacity: 0.2
    }).addTo(window.leafletMap);
    
    // Add popup to polygon
    const totalArea = allPoints.length > 2 ? calculatePolygonArea(allPoints) : 0;
    polygon.bindPopup(`
      <div class="marker-popup">
        <h4>Survey Area</h4>
        <p><strong>Total Points:</strong> ${surveyPoints.length}</p>
        <p><strong>Total Distance:</strong> ${surveyPoints.reduce((sum, point) => sum + point.distance, 0).toFixed(2)} m</p>
        <p><strong>Area:</strong> ${totalArea.toFixed(2)} m²</p>
      </div>
    `);
  }

  // Fit map to show all points
  const bounds = L.latLngBounds(allPoints.length ? allPoints : [startLatLng]);
  window.leafletMap.fitBounds(bounds, { padding: [20, 20] });

  // Save survey data to database
  await saveSurveyToDatabase(allPoints, surveyPoints, startPoint);
  
  // Close modal
  hideBearingsModal();
  
  // Show success message
  alert(`Survey added successfully!\n\nTotal Points: ${surveyPoints.length + 1}\nTotal Distance: ${surveyPoints.reduce((sum, point) => sum + point.distance, 0).toFixed(2)} m`);
}

// Function to save survey data to database using Tie Line method
async function saveSurveyToDatabase(latLngPoints, surveyPoints, startPoint) {
  try {
    // Sanity-check points
    const cleaned = (latLngPoints || [])
      .map(p => Array.isArray(p) ? { lat: Number(p[0]), lng: Number(p[1]) } : { lat: Number(p.lat), lng: Number(p.lng) })
      .filter(p => !isNaN(p.lat) && !isNaN(p.lng));
    if (cleaned.length < 2) {
      alert('Cannot save: not enough valid points to form a path.');
      return;
    }
    // Calculate total area using shoelace formula
    const totalArea = calculatePolygonArea(latLngPoints);
    const totalDistance = surveyPoints.reduce((sum, point) => sum + point.distance, 0);

    // Prepare the survey data for database (no tie line metadata)
    const surveyData = {
      survey_type: 'local_grid',
      reference_origin: referenceOrigin,
      total_points: surveyPoints.length + 1,
      total_distance: totalDistance,
      total_area: totalArea,
      starting_easting: startPoint.easting,
      starting_northing: startPoint.northing,
      survey_points: surveyPoints,
      created_at: new Date().toISOString()
    };
    
    console.log('Saving survey data with tie line method:', surveyData);
    
    // Build minimal payload to avoid schema mismatch: only required columns
    const payload = {
      // Store path as arrays for maximum compatibility; readers can also handle objects
      path: cleaned.map(p => [p.lat, p.lng]),
      lo_name: (document.getElementById('lo-name-input')?.value || '').trim() || null
    };

    const { data, error } = await supabase
      .from('land_areas')
      .insert([payload]);
    
    if (error) {
      console.error('Error saving survey to database:', error);
      alert('Failed to save to database: ' + (error.message || JSON.stringify(error)));
    } else {
      console.log('Survey saved successfully:', data);
      
      // Refresh the land areas list to show the new survey
      if (typeof fetchAndRenderLandAreas === 'function') {
        await fetchAndRenderLandAreas();
      }
    }
    
  } catch (error) {
    console.error('Error in saveSurveyToDatabase:', error);
    alert('Unexpected error while saving: ' + (error.message || String(error)));
  }
}

// Function to edit point
function editPoint(pointId) {
  const point = surveyPoints.find(p => p.id === pointId);
  if (!point) return;
  
  // Simple edit using prompts
  const newNorthing = prompt('Enter new Northing:', point.northing);
  const newEasting = prompt('Enter new Easting:', point.easting);
  
  if (newNorthing !== null && newEasting !== null && !isNaN(newNorthing) && !isNaN(newEasting)) {
    point.northing = parseFloat(newNorthing);
    point.easting = parseFloat(newEasting);
    
    // Recalculate distance and bearing
    let prevPoint;
    const pointIndex = surveyPoints.findIndex(p => p.id === pointId);
    if (pointIndex === 0) {
      prevPoint = {
        easting: parseFloat(document.getElementById('starting-easting').value.replace(/[^\d.-]/g, '')),
        northing: parseFloat(document.getElementById('starting-northing').value.replace(/[^\d.-]/g, ''))
      };
    } else {
      prevPoint = surveyPoints[pointIndex - 1];
    }
    
    const deltaE = point.easting - prevPoint.easting;
    const deltaN = point.northing - prevPoint.northing;
    point.distance = Math.sqrt(deltaE * deltaE + deltaN * deltaN);
    
    let bearing = Math.atan2(deltaE, deltaN) * (180 / Math.PI);
    if (bearing < 0) bearing += 360;
    
    if (bearing <= 90) {
      point.bearing = `N${bearing.toFixed(1)}°E`;
    } else if (bearing <= 180) {
      point.bearing = `S${(180 - bearing).toFixed(1)}°E`;
    } else if (bearing <= 270) {
      point.bearing = `S${(bearing - 180).toFixed(1)}°W`;
    } else {
      point.bearing = `N${(360 - bearing).toFixed(1)}°W`;
    }
    point.azimuth = bearing;
    
    updatePointsTable();
    updateSummary();
  }
}

// Function to delete point
function deletePoint(pointId) {
  if (!confirm('Are you sure you want to delete this point?')) return;
  
  const pointIndex = surveyPoints.findIndex(p => p.id === pointId);
  if (pointIndex > -1) {
    surveyPoints.splice(pointIndex, 1);
    
    updatePointsTable();
    updateSummary();
    
    if (surveyPoints.length === 0) {
      addSurveyToMapBtn.disabled = true;
    }
  }
}

// Function to add a new bearing (legacy function - kept for compatibility)
function addNewBearing() {
  const bearingId = Date.now();
  
  // Get current map center if available
  let lat = 0, lng = 0;
  if (window.leafletMap) {
    const center = window.leafletMap.getCenter();
    lat = center.lat;
    lng = center.lng;
  }
  
  const bearing = {
    id: bearingId,
    name: `Bearing ${bearings.length + 1}`,
    lat: lat,
    lng: lng,
    angle: 0,
    distance: 100,
    createdAt: new Date().toISOString()
  };
  
  bearings.push(bearing);
  
  // Add marker to map if map exists
  if (window.leafletMap) {
    addBearingToMap(bearing);
  }
}

// Function to add bearing to map
function addBearingToMap(bearing) {
  if (!window.leafletMap) return;
  
  // Determine start and end coordinates
  let startLat, startLng, endLat, endLng;
  
  if (bearing.endLat && bearing.endLng) {
    // New format with calculated coordinates
    startLat = bearing.lat;
    startLng = bearing.lng;
    endLat = bearing.endLat;
    endLng = bearing.endLng;
  } else {
    // Legacy format - calculate end point
    startLat = bearing.lat;
    startLng = bearing.lng;
    endLat = bearing.lat + (bearing.distance * Math.cos(bearing.angle * Math.PI / 180) / 111320);
    endLng = bearing.lng + (bearing.distance * Math.sin(bearing.angle * Math.PI / 180) / (111320 * Math.cos(bearing.lat * Math.PI / 180)));
  }
  
  // Create start marker
  const startMarker = L.marker([startLat, startLng], {
    icon: L.divIcon({
      className: 'bearing-marker',
      html: `<div style="background: #ffd600; color: #23272f; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; border: 2px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">S</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    })
  });
  
  // Create end marker
  const endMarker = L.marker([endLat, endLng], {
    icon: L.divIcon({
      className: 'bearing-marker',
      html: `<div style="background: #28a745; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; border: 2px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">E</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    })
  });
  
  // Create bearing line
  const line = L.polyline([[startLat, startLng], [endLat, endLng]], {
    color: '#ffd600',
    weight: 3,
    opacity: 0.8,
    dashArray: '5, 5'
  });
  
  // Create popup content
  let popupContent = `
    <div style="min-width: 250px;">
      <h4 style="margin: 0 0 8px 0; color: #23272f;">${bearing.name}</h4>
      <p style="margin: 4px 0;"><strong>Distance:</strong> ${bearing.distance}m</p>
  `;
  
  if (bearing.bearing) {
    popupContent += `<p style="margin: 4px 0;"><strong>Bearing:</strong> ${bearing.bearing}</p>`;
  }
  
  if (bearing.angle !== undefined) {
    popupContent += `<p style="margin: 4px 0;"><strong>Azimuth:</strong> ${bearing.angle.toFixed(3)}°</p>`;
  }
  
  if (bearing.startEasting && bearing.startNorthing) {
    popupContent += `<p style="margin: 4px 0;"><strong>Start:</strong> E${bearing.startEasting.toFixed(2)}, N${bearing.startNorthing.toFixed(2)}</p>`;
    popupContent += `<p style="margin: 4px 0;"><strong>End:</strong> E${bearing.endEasting.toFixed(2)}, N${bearing.endNorthing.toFixed(2)}</p>`;
  }
  
  popupContent += `
      <div style="margin-top: 8px;">
        <button onclick="editBearing(${bearing.id})" style="background: #ffd600; color: #23272f; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; margin-right: 4px;">Edit</button>
        <button onclick="deleteBearing(${bearing.id})" style="background: #ff4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">Delete</button>
      </div>
    </div>
  `;
  
  startMarker.bindPopup(popupContent);
  endMarker.bindPopup(popupContent);
  line.bindPopup(popupContent);
  
  // Add to map
  startMarker.addTo(window.leafletMap);
  endMarker.addTo(window.leafletMap);
  line.addTo(window.leafletMap);
  
  // Store reference
  bearingMarkers.push({
    id: bearing.id,
    startMarker: startMarker,
    endMarker: endMarker,
    line: line
  });
}



// Function to edit bearing
function editBearing(bearingId) {
  const bearing = bearings.find(b => b.id === bearingId);
  if (!bearing) return;
  
  // Simple prompt-based editing (can be enhanced with a modal)
  const newName = prompt('Enter bearing name:', bearing.name);
  if (newName !== null) bearing.name = newName;
  
  const newAngle = prompt('Enter angle (degrees):', bearing.angle);
  if (newAngle !== null && !isNaN(newAngle)) bearing.angle = parseFloat(newAngle);
  
  const newDistance = prompt('Enter distance (meters):', bearing.distance);
  if (newDistance !== null && !isNaN(newDistance)) bearing.distance = parseFloat(newDistance);
  
  // Update map
  updateBearingOnMap(bearing);
}

// Make functions globally accessible
window.editBearing = editBearing;
window.deleteBearing = deleteBearing;
window.editPoint = editPoint;
window.deletePoint = deletePoint;

// Function to update bearing on map
function updateBearingOnMap(bearing) {
  const markerData = bearingMarkers.find(m => m.id === bearing.id);
  if (!markerData || !window.leafletMap) return;
  
  // Remove old markers and line
  if (markerData.startMarker) window.leafletMap.removeLayer(markerData.startMarker);
  if (markerData.endMarker) window.leafletMap.removeLayer(markerData.endMarker);
  if (markerData.line) window.leafletMap.removeLayer(markerData.line);
  
  // Add updated markers and line
  addBearingToMap(bearing);
  
  // Remove old reference
  const index = bearingMarkers.findIndex(m => m.id === bearing.id);
  if (index > -1) {
    bearingMarkers.splice(index, 1);
  }
}

// Function to delete bearing
function deleteBearing(bearingId) {
  if (!confirm('Are you sure you want to delete this bearing?')) return;
  
  // Remove from map
  const markerData = bearingMarkers.find(m => m.id === bearingId);
  if (markerData && window.leafletMap) {
    if (markerData.startMarker) window.leafletMap.removeLayer(markerData.startMarker);
    if (markerData.endMarker) window.leafletMap.removeLayer(markerData.endMarker);
    if (markerData.line) window.leafletMap.removeLayer(markerData.line);
  }
  
  // Remove from arrays
  bearings = bearings.filter(b => b.id !== bearingId);
  bearingMarkers = bearingMarkers.filter(m => m.id !== bearingId);
}

// Fetch land areas when map is shown
if (document.getElementById('map')) {
  fetchAndRenderLandAreas();
}
// Optionally, re-fetch when returning to map
window.navigateTo = (function(origNav) {
  return function(sectionId) {
    if (origNav) origNav(sectionId);
    if (sectionId === 'map') {
      fetchAndRenderLandAreas();
    }
  };
})(window.navigateTo);        

// Helper function to show owner profile popup
async function showOwnerProfilePopup(area, coords, map, latlng) {
  // Debug output
  console.log('showOwnerProfilePopup', { map, latlng, coords, area });
  if (!map) console.error('Map is undefined');
  if (!latlng) console.error('popupLatLng is undefined');
  // Fetch owner and user info for this land area
  let ownerName = 'Unknown';
  let addedBy = 'Unknown User';
  let createdAt = null;
  try {
    const { data: ownerData, error: ownerError } = await supabase
      .from('owners')
      .select('name, user_id, created_at')
      .eq('land_area_id', area.id)
      .single();
    if (!ownerError && ownerData) {
      ownerName = ownerData.name || 'Unknown';
      createdAt = ownerData.created_at;
      if (ownerData.user_id) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('user_firstname, user_lastname, user_email')
          .eq('user_id', ownerData.user_id)
          .single();
        if (!userError && userData) {
          addedBy = `${userData.user_firstname || ''} ${userData.user_lastname || ''}`.trim();
          if (!addedBy) addedBy = userData.user_email;
        }
      }
    }
  } catch (e) {
    console.log('Exception during owner/user fetch:', e);
  }
  let popupLatLng = latlng;
  if (!popupLatLng && coords && coords.length > 0) {
    console.log('coords[0]:', coords[0]);
    // Defensive: check if coords[0] is [lat, lng] or [lng, lat]
    let lat = coords[0][0];
    let lng = coords[0][1];
    // If lat is outside [-90, 90], swap
    if (lat > 90 || lat < -90) {
      [lat, lng] = [lng, lat];
    }
    popupLatLng = L.latLng(lat, lng);
  }
  console.log('Popup LatLng:', popupLatLng);
  if (!popupLatLng || isNaN(popupLatLng.lat) || isNaN(popupLatLng.lng)) {
    console.error('Invalid popupLatLng:', popupLatLng);
    return;
  }
  // Land info popup content (replaces elevation fields)
  const fieldOrNA = (v) => (v === null || v === undefined || v === '' ? 'N/A' : v);
  let cardHtml = `<div class='owner-profile-card' style='min-width:260px;max-width:360px;padding:14px 14px 12px 14px;border-radius:14px;background:#fff;box-shadow:0 8px 28px rgba(0,0,0,.15);border:1px solid #ececec;font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell;'>`;
  cardHtml += `<div style='display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;'>` +
              `<div style='font-size:1.02em;font-weight:700;color:#222;'>Land Information</div>` +
              `</div>`;
  cardHtml += `<div style='display:grid;grid-template-columns:112px 1fr;gap:6px 10px;font-size:.94em;color:#222;'>`;
  cardHtml += `<div><b>LHID:</b></div><div>${fieldOrNA(area.lhid)}</div>`;
  cardHtml += `<div><b>Title Number:</b></div><div>${fieldOrNA(area.title_number)}</div>`;
  cardHtml += `<div><b>LO Name:</b></div><div>${fieldOrNA(area.lo_name)}</div>`;
  cardHtml += `<div><b>MOA:</b></div><div>${fieldOrNA(area.moa)}</div>`;
  cardHtml += `<div><b>Barangay Name:</b></div><div>${fieldOrNA(area.barangay_name)}</div>`;
  cardHtml += `<div><b>Total Area:</b></div><div>${fieldOrNA(area.total_area)}</div>`;
  cardHtml += `<div><b>Survey Number:</b></div><div>${fieldOrNA(area.survey_number)}</div>`;
  cardHtml += `<div><b>Lot Number:</b></div><div>${fieldOrNA(area.lot_number)}</div>`;
  cardHtml += `<div><b>Current Status:</b></div><div>${fieldOrNA(area.current_status)}</div>`;
  cardHtml += `<div><b>Status Description:</b></div><div>${fieldOrNA(area.current_status_desc)}</div>`;
  cardHtml += `<div><b>Problem Category:</b></div><div>${fieldOrNA(area.problem_category)}</div>`;
  cardHtml += `<div><b>Sub Category:</b></div><div>${fieldOrNA(area.sub_category)}</div>`;
  const landStatus = area.land_status || 'workable';
  const statusIcon = landStatus === 'problematic' ? '⚠️' : '✅';
  const statusClass = landStatus === 'problematic' ? 'status-problematic' : 'status-workable';
  cardHtml += `<div><b>Land Status:</b></div><div class="${statusClass}">${statusIcon} ${landStatus.charAt(0).toUpperCase() + landStatus.slice(1)}</div>`;
  cardHtml += `<div><b>Remarks:</b></div><div>${fieldOrNA(area.remarks)}</div>`;
  cardHtml += `</div>`;
  cardHtml += `<div style='display:flex;gap:0.75rem;margin-top:1rem;'>`+
    `<button id='assign-task-${area.id}' style='
      background: var(--warning);
      color: white;
      border: none;
      border-radius: var(--radius);
      padding: 0.75rem 1rem;
      font-weight: 600;
      cursor: pointer;
      font-size: 0.875rem;
      transition: all 0.2s ease;
      flex: 1;
    ' onmouseover="this.style.background='var(--warning-hover)'" onmouseout="this.style.background='var(--warning)'">Survey Land</button>`+
    `<button id='edit-land-${area.id}' style='
      background: white;
      color: var(--neutral-700);
      border: 1px solid var(--neutral-300);
      border-radius: var(--radius);
      padding: 0.75rem 1rem;
      font-weight: 600;
      cursor: pointer;
      font-size: 0.875rem;
      transition: all 0.2s ease;
      flex: 1;
    ' onmouseover="this.style.background='var(--neutral-50)'; this.style.borderColor='var(--primary)'" onmouseout="this.style.background='white'; this.style.borderColor='var(--neutral-300)'">Edit Info</button>`+
  `</div>`;
  cardHtml += `<div style='margin-top:10px;color:#6b7280;font-size:.82em;border-top:1px solid #f0f0f0;padding-top:8px;'><span style='color:#374151;font-weight:600;'>Added by:</span> ${addedBy}${createdAt ? ` • <span style='color:#374151;font-weight:600;'>Created:</span> ${new Date(createdAt).toLocaleString()}` : ''}</div>`;
  cardHtml += `</div>`;
  if (map && map.invalidateSize) {
    map.invalidateSize();
  }
  if (map && popupLatLng) {
    L.popup({ maxWidth: 380 })
      .setLatLng(popupLatLng)
      .setContent(cardHtml)
      .openOn(map);
    // Wire buttons once popup is added to DOM
    setTimeout(() => {
      const assignBtn = document.getElementById(`assign-task-${area.id}`);
      const editBtn = document.getElementById(`edit-land-${area.id}`);
      if (assignBtn) assignBtn.onclick = () => showAssignTaskModal(area);
      if (editBtn) editBtn.onclick = () => showEditLandInfoModal(area);
    }, 0);
  }
}        

// ==== Assign Task Modal Logic ====
function showAssignTaskModal(area) {
  const modal = document.getElementById('assign-task-modal');
  if (!modal) return;
  const landIdInput = document.getElementById('task-land-id');
  const techSelect = document.getElementById('task-technician');
  landIdInput.value = area.id;
  (async () => {
    const { data: users } = await supabase.from('users').select('user_id, user_firstname, user_lastname, role, active');
    const techs = (users || []).filter(u => (u.role || '').toLowerCase() === 'technician' && u.active !== false);
    techSelect.innerHTML = techs.map(t => `<option value="${t.user_id}">${(t.user_firstname||'').trim()} ${(t.user_lastname||'').trim()} (${t.user_id})</option>`).join('');
  })();
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  // Close handlers (X and Cancel)
  const closeBtn = document.getElementById('assign-task-close');
  const cancelBtn = document.getElementById('assign-task-cancel');
  const closeModal = () => { modal.style.display = 'none'; document.body.style.overflow = ''; };
  if (closeBtn) closeBtn.onclick = closeModal;
  if (cancelBtn) cancelBtn.onclick = closeModal;
  modal.addEventListener('keydown', (e) => { if (e.key === 'Escape') { modal.style.display = 'none'; document.body.style.overflow = ''; }});
  document.getElementById('assign-task-save').onclick = async () => {
    const assigneeId = parseInt(techSelect.value, 10);
    const dueDate = (document.getElementById('task-due-date').value || null);
    const priority = document.getElementById('task-priority').value || 'low';
    const notes = document.getElementById('task-notes').value || null;
    const payload = { land_area_id: area.id, assigned_to: assigneeId, status: 'assigned', due_date: dueDate, priority, notes };
    const { error } = await supabase.from('tasks').insert([payload]);
    if (error) { alert('Failed to assign task: ' + error.message); return; }
    modal.style.display = 'none';
    document.body.style.overflow = '';
    alert('Task assigned successfully.');
  };
}

// ==== Edit Land Info Modal Logic ====
function showEditLandInfoModal(area) {
  const modal = document.getElementById('edit-land-modal');
  if (!modal) return;
  const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v ?? ''; };
  document.getElementById('edit-land-id').value = area.id;
  setVal('edit-lhid', area.lhid);
  setVal('edit-title-number', area.title_number);
  setVal('edit-lo-name', area.lo_name);
  setVal('edit-moa', area.moa);
  setVal('edit-barangay-name', area.barangay_name);
  setVal('edit-total-area', area.total_area);
  setVal('edit-survey-number', area.survey_number);
  setVal('edit-lot-number', area.lot_number);
  setVal('edit-current-status', area.current_status);
  setVal('edit-current-status-desc', area.current_status_desc);
  setVal('edit-problem-category', area.problem_category);
  setVal('edit-sub-category', area.sub_category);
  setVal('edit-land-status', area.land_status || 'workable');
  setVal('edit-remarks', area.remarks);
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  const closeEditBtn = document.getElementById('edit-land-close');
  const cancelEditBtn = document.getElementById('edit-land-cancel');
  const closeEditModal = () => { modal.style.display = 'none'; document.body.style.overflow = ''; };
  if (closeEditBtn) closeEditBtn.onclick = closeEditModal;
  if (cancelEditBtn) cancelEditBtn.onclick = closeEditModal;
  modal.addEventListener('keydown', (e) => { if (e.key === 'Escape') { modal.style.display = 'none'; document.body.style.overflow = ''; }});
  document.getElementById('edit-land-save').onclick = async () => {
    // Build a diff-only update so changing one field is enough
    const fieldIds = {
      lhid: 'edit-lhid',
      title_number: 'edit-title-number',
      lo_name: 'edit-lo-name',
      moa: 'edit-moa',
      barangay_name: 'edit-barangay-name',
      total_area: 'edit-total-area',
      survey_number: 'edit-survey-number',
      lot_number: 'edit-lot-number',
      current_status: 'edit-current-status',
      current_status_desc: 'edit-current-status-desc',
      problem_category: 'edit-problem-category',
      sub_category: 'edit-sub-category',
      land_status: 'edit-land-status',
      remarks: 'edit-remarks'
    };
    const update = {};
    for (const [column, inputId] of Object.entries(fieldIds)) {
      const el = document.getElementById(inputId);
      if (!el) continue;
      const newValRaw = (el.value ?? '').trim();
      const oldValRaw = (area[column] ?? '').toString().trim();
      if (newValRaw === '' && oldValRaw !== '') {
        // Allow clearing a value explicitly
        update[column] = null;
      } else if (newValRaw !== '' && newValRaw !== oldValRaw) {
        update[column] = newValRaw;
      }
    }
    if (Object.keys(update).length === 0) {
      alert('No changes detected to save.');
      return;
    }
    const landId = document.getElementById('edit-land-id').value;
    const { data: updated, error } = await supabase
      .from('land_areas')
      .update(update)
      .eq('id', landId)
      .select('*')
      .maybeSingle();
    if (error) { console.error('Update failed:', error); alert('Failed to update land info: ' + error.message); return; }
    if (!updated) {
      // Determine whether the row exists (RLS/no change) vs not found
      const { data: exists } = await supabase.from('land_areas').select('id').eq('id', landId).maybeSingle();
      if (!exists) { alert('Land area not found.'); return; }
      alert('Update didn\'t persist (likely RLS policy or no changed values).');
      return;
    }
    modal.style.display = 'none';
    document.body.style.overflow = '';
    alert('Land information updated.');
    // Refresh list
    if (typeof fetchAndRenderLandAreas === 'function') fetchAndRenderLandAreas();
    // Reopen popup with fresh data
    try {
      const { data: updatedArea } = await supabase.from('land_areas').select('*').eq('id', landId).single();
      let coords = updatedArea?.path ?? area.path;
      if (typeof coords === 'string') { try { coords = JSON.parse(coords); } catch {} }
      if (Array.isArray(coords) && coords.length && !Array.isArray(coords[0]) && coords[0] && typeof coords[0].lat === 'number') {
        coords = coords.map(p => [p.lat, p.lng]);
      }
      showOwnerProfilePopup(updatedArea || area, coords, window.leafletMap, null);
    } catch {}
  };
}        

// Auto-refresh the map and land areas on system open

document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('mapid')) {
    initMap();
  }
  if (document.getElementById('map')) {
    fetchAndRenderLandAreas();
  }
  // Wire the Map Records tab open event
  document.addEventListener('map-records-tab-open', () => {
    renderMapRecordsReport();
  });
});        

// === Elevation Analysis for Land Areas ===
// Set your Google Elevation API key here
const GOOGLE_ELEVATION_API_KEY = 'AIzaSyDLLXQJwdpEXNeDsHTmDwkt8kKlJg-sPDk'; // <-- Set this before running

// Use Open-Elevation API (no key required)
async function getElevationsForPoints(points) {
  // Open-Elevation API: batch POST request
  const locations = points.map(([lat, lng]) => ({ latitude: lat, longitude: lng }));
  const res = await fetch('https://api.open-elevation.com/api/v1/lookup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ locations })
  });
  const data = await res.json();
  if (!data.results) throw new Error('Open-Elevation API error');
  return data.results.map(r => r.elevation);
}

async function analyzeAndUpdateLandAreaElevations() {
  console.log('Fetching land areas from Supabase...');
  const { data: landAreas, error } = await supabase
    .from('land_areas')
    .select('id, path');
  if (error) {
    console.error('Error fetching land areas:', error);
    return;
  }
  for (const area of landAreas) {
    let coords = area.path;
    if (typeof coords === 'string') {
      try { coords = JSON.parse(coords); } catch { console.warn('Invalid path for area', area.id); continue; }
    }
    if (!Array.isArray(coords) || coords.length < 3) {
      console.warn('Skipping area with insufficient points:', area.id);
      continue;
    }
    try {
      console.log(`Querying elevation for area ${area.id}...`);
      const elevations = await getElevationsForPoints(coords);
      const min = Math.min(...elevations);
      const max = Math.max(...elevations);
      const avg = elevations.reduce((a, b) => a + b, 0) / elevations.length;
      const isSlope = (max - min) > 5; // Example: >5m difference = slope
      // Update Supabase
      const { error: updateError } = await supabase
        .from('land_areas')
        .update({
          min_elevation: min,
          max_elevation: max,
          avg_elevation: avg,
          is_slope: isSlope
        })
        .eq('id', area.id);
      if (updateError) {
        console.error('Failed to update area', area.id, updateError);
      } else {
        console.log(`Updated area ${area.id}: min=${min}, max=${max}, avg=${avg}, isSlope=${isSlope}`);
      }
    } catch (e) {
      console.error('Error processing area', area.id, e);
    }
  }
  console.log('Elevation analysis complete.');
}
// To run: analyzeAndUpdateLandAreaElevations();        

// Fetch elevation at a point using Open-Meteo API with validation and logging
async function getElevationAtPoint(lat, lng) {
  console.log('getElevationAtPoint called with:', lat, lng, typeof lat, typeof lng);
  if (
    typeof lat !== 'number' ||
    typeof lng !== 'number' ||
    isNaN(lat) ||
    isNaN(lng)
  ) {
    console.error('Invalid coordinates for elevation fetch:', lat, lng);
    throw new Error('Invalid coordinates for elevation fetch');
  }
  const url = `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error('Elevation API fetch failed:', res.status, res.statusText, url);
    throw new Error('Elevation API fetch failed');
  }
  const data = await res.json();
  return data.elevation[0];
}        
        
// === Reports: Map Records ===
function setupMapRecordsReportRendering() {
  // If the reports section is visible and the Map Records tab is active, render
  try {
    const reportsSection = document.getElementById('home');
    const reportContent = document.getElementById('report-content');
    const activeBtn = document.querySelector(".report-tab-btn.active");
    if (!reportsSection || !reportContent || !activeBtn) return;
    if (activeBtn.getAttribute('data-tab') === 'map-records') {
      renderMapRecordsReport();
    }
  } catch {}
}

async function renderMapRecordsReport() {
  const table = document.getElementById('map-records-table');
  const reportContent = document.getElementById('report-content');
  if (!reportContent) return;
  if (!table) {
    // If user switched quickly, rebuild minimal scaffold and continue
    reportContent.innerHTML = `<h3 style='color:#ffd600; margin-bottom:10px;'>Map Records</h3>
      <table id="map-records-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>LO Name</th>
            <th>Barangay</th>
            <th>Status</th>
            <th>Total Area (m²)</th>
            <th># Points</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody><tr><td colspan="7">Loading...</td></tr></tbody>
      </table>`;
  }
  const tbody = document.querySelector('#map-records-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="7">Loading...</td></tr>';

  // Fetch land_areas with minimal fields used in the report
  const { data, error } = await supabase
    .from('land_areas')
    .select('id, lo_name, barangay_name, current_status, total_area, path, created_at')
    .order('created_at', { ascending: false });
  if (error) {
    tbody.innerHTML = `<tr><td colspan="7">Failed to load map records.</td></tr>`;
    return;
  }
  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7">No map records found.</td></tr>`;
    return;
  }
  const rows = data.map(row => {
    let pointsCount = 0;
    try {
      let p = row.path;
      if (typeof p === 'string') p = JSON.parse(p);
      if (Array.isArray(p)) pointsCount = p.length;
    } catch {}
    const created = row.created_at ? new Date(row.created_at).toLocaleString() : '';
    const area = typeof row.total_area === 'number' ? row.total_area.toFixed(2) : (row.total_area || '');
    return `<tr>
      <td>${row.id}</td>
      <td>${row.lo_name || ''}</td>
      <td>${row.barangay_name || ''}</td>
      <td>${row.current_status || ''}</td>
      <td>${area}</td>
      <td>${pointsCount}</td>
      <td>${created}</td>
    </tr>`;
  }).join('');
  tbody.innerHTML = rows;
}