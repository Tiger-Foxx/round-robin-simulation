document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const canvas = document.getElementById('simulationCanvas');
    const ctx = canvas.getContext('2d');
    const simulationAreaContainer = document.getElementById('simulationAreaContainer');

    const numSitesSelect = document.getElementById('numSites');
    const numHostsSelect = document.getElementById('numHosts');
    const applyNetworkConfigBtn = document.getElementById('applyNetworkConfig');
    
    const wanLinksConfigContainer = document.getElementById('wanLinksConfigContainer');
    const addWanLinkBtn = document.getElementById('addWanLink');

    const algorithmSelect = document.getElementById('algorithm');
    const packetRateSlider = document.getElementById('packetRate');
    const packetRateValueSpan = document.getElementById('packetRateValue');
    const totalPacketsInput = document.getElementById('totalPackets');
    const animationSpeedSlider = document.getElementById('animationSpeed');
    const animationSpeedValueSpan = document.getElementById('animationSpeedValue');
    const startButton = document.getElementById('startButton');
    const stopButton = document.getElementById('stopButton');

    const statsContent = document.getElementById('statsContent');
    const statsChartCanvas = document.getElementById('statsChartCanvas');
    let statsChart = null;

    // Simulation State
    let sites = [];
    let wanLinks = [];
    let packets = [];
    let simulationRunning = false;
    let packetIdCounter = 0;
    let packetsSentCount = 0;
    let animationFrameId;
    let packetGenerationIntervalId;

    // Default WAN link types and colors
    const defaultLinkTypes = [
        { name: "MPLS", color: "#3498db", bandwidth: 100, latency: 20, loss: 0.1, weight: 3 },
        { name: "Fibre Optique", color: "#2ecc71", bandwidth: 1000, latency: 5, loss: 0.01, weight: 5 },
        { name: "Internet (Broadband)", color: "#f1c40f", bandwidth: 200, latency: 50, loss: 1, weight: 2 },
        { name: "4G/LTE", color: "#e74c3c", bandwidth: 50, latency: 80, loss: 2, weight: 1 },
        { name: "Satellite", color: "#9b59b6", bandwidth: 20, latency: 600, loss: 3, weight: 1 }
    ];
    let linkIdCounter = 0;

    // --- Canvas Resizing ---
    function resizeCanvas() {
        canvas.width = simulationAreaContainer.clientWidth;
        canvas.height = simulationAreaContainer.clientHeight;
        if (sites.length > 0) { // Re-initialize positions if network exists
            initializeNetworkLayout(); 
            drawNetwork();
        }
    }
    window.addEventListener('resize', resizeCanvas);
    

    // --- Network Initialization ---
    function initializeNetworkLayout() {
        const numSites = parseInt(numSitesSelect.value);
        const numHostsPerSite = parseInt(numHostsSelect.value);
        sites = []; // Clear existing sites

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(canvas.width, canvas.height) / 3;

        for (let i = 0; i < numSites; i++) {
            const angle = (i / numSites) * 2 * Math.PI;
            const siteX = centerX + radius * Math.cos(angle);
            const siteY = centerY + radius * Math.sin(angle);
            
            const site = {
                id: `site-${i}`,
                name: `Succursale ${String.fromCharCode(65 + i)}`,
                x: siteX,
                y: siteY,
                radius: 30, // Site radius
                cpe: { x: siteX, y: siteY, radius: 10 }, // CPE co-located for simplicity
                hosts: []
            };

            for (let j = 0; j < numHostsPerSite; j++) {
                // Position hosts around the site's CPE
                const hostAngle = (j / numHostsPerSite) * 2 * Math.PI + angle + Math.PI / 4; // Offset angle slightly
                const hostRadius = site.radius * 1.5;
                site.hosts.push({
                    id: `host-${i}-${j}`,
                    x: site.x + hostRadius * Math.cos(hostAngle),
                    y: site.y + hostRadius * Math.sin(hostAngle),
                    radius: 8
                });
            }
            sites.push(site);
        }
        // Re-assign link sources/targets if sites changed
        wanLinks.forEach(link => {
            if (link.sourceSiteIndex >= numSites || link.targetSiteIndex >= numSites) {
                // If a site used by a link is removed, try to re-assign or mark as invalid
                // For now, we'll just let it be, user should reconfigure if network structure changes drastically
            }
        });
        drawNetwork();
    }

    function applyNetworkConfigHandler() {
        resizeCanvas(); // This will call initializeNetworkLayout if canvas size changes, else call it directly
        initializeNetworkLayout();
        updateWanLinkSiteSelectors(); // Update dropdowns for site selection in links
    }
    applyNetworkConfigBtn.addEventListener('click', applyNetworkConfigHandler);
    

    // --- WAN Link Configuration ---
    function addWanLinkUI(linkData = null) {
        const linkIndex = wanLinks.length;
        const newLinkId = `wanlink-${linkIdCounter++}`;

        const defaultType = defaultLinkTypes[linkIndex % defaultLinkTypes.length];
        const link = linkData || {
            id: newLinkId,
            type: defaultType.name,
            color: defaultType.color,
            bandwidth: defaultType.bandwidth,
            latency: defaultType.latency,
            loss: defaultType.loss,
            weight: defaultType.weight,
            sourceSiteIndex: 0, // Default to first site
            targetSiteIndex: sites.length > 1 ? 1 : 0, // Default to second site or first if only one
            packetsOnLink: 0,
            totalPacketsSent: 0
        };
        if (!linkData) wanLinks.push(link); // Add to array only if it's a new link

        const div = document.createElement('div');
        div.className = 'wan-link-config';
        div.dataset.linkId = link.id;

        let siteOptions = '';
        sites.forEach((s, i) => {
            siteOptions += `<option value="${i}">${s.name}</option>`;
        });

        div.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <h4 class="text-md font-semibold text-cyan-300">Lien WAN ${wanLinks.length}</h4>
                <button class="remove-link-btn" data-link-id="${link.id}"><i class="fas fa-trash-alt"></i></button>
            </div>
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label>Type:</label>
                    <select class="link-type">
                        ${defaultLinkTypes.map(t => `<option value="${t.name}" ${t.name === link.type ? 'selected' : ''}>${t.name}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label>Couleur:</label>
                    <input type="color" class="link-color" value="${link.color}">
                </div>
                 <div>
                    <label>Site Source:</label>
                    <select class="link-source-site">${siteOptions}</select>
                </div>
                <div>
                    <label>Site Destination:</label>
                    <select class="link-target-site">${siteOptions}</select>
                </div>
            </div>
            <div class="grid grid-cols-3 gap-3 mt-3">
                <div>
                    <label>BP (Mbps):</label>
                    <input type="number" class="link-bandwidth" value="${link.bandwidth}" min="1">
                </div>
                <div>
                    <label>Latence (ms):</label>
                    <input type="number" class="link-latency" value="${link.latency}" min="1">
                </div>
                <div>
                    <label>Poids (WRR):</label>
                    <input type="number" class="link-weight" value="${link.weight}" min="1">
                </div>
            </div>
            <p class="text-xs text-gray-500 mt-1">Perte: <span class="link-loss-display">${link.loss}</span>% (auto basé sur type)</p>
        `;
        wanLinksConfigContainer.appendChild(div);

        // Set selected sites
        div.querySelector('.link-source-site').value = link.sourceSiteIndex;
        div.querySelector('.link-target-site').value = link.targetSiteIndex;

        // Event listeners for this link's inputs
        div.querySelector('.link-type').addEventListener('change', (e) => {
            const selectedType = defaultLinkTypes.find(t => t.name === e.target.value);
            if (selectedType) {
                link.type = selectedType.name;
                link.color = selectedType.color;
                link.bandwidth = selectedType.bandwidth;
                link.latency = selectedType.latency;
                link.loss = selectedType.loss;
                link.weight = selectedType.weight; // Could also keep user-defined weight
                div.querySelector('.link-color').value = link.color;
                div.querySelector('.link-bandwidth').value = link.bandwidth;
                div.querySelector('.link-latency').value = link.latency;
                div.querySelector('.link-weight').value = link.weight;
                div.querySelector('.link-loss-display').textContent = link.loss;
                drawNetwork();
            }
        });
        div.querySelector('.link-color').addEventListener('input', (e) => { link.color = e.target.value; drawNetwork(); });
        div.querySelector('.link-bandwidth').addEventListener('change', (e) => { link.bandwidth = parseInt(e.target.value); });
        div.querySelector('.link-latency').addEventListener('change', (e) => { link.latency = parseInt(e.target.value); });
        div.querySelector('.link-weight').addEventListener('change', (e) => { link.weight = parseInt(e.target.value); });
        div.querySelector('.link-source-site').addEventListener('change', (e) => { link.sourceSiteIndex = parseInt(e.target.value); drawNetwork(); });
        div.querySelector('.link-target-site').addEventListener('change', (e) => { link.targetSiteIndex = parseInt(e.target.value); drawNetwork(); });
        
        div.querySelector('.remove-link-btn').addEventListener('click', (e) => {
            const idToRemove = e.currentTarget.dataset.linkId;
            wanLinks = wanLinks.filter(l => l.id !== idToRemove);
            wanLinksConfigContainer.removeChild(div);
            // Re-index displayed link numbers if needed, or just remove
            // For simplicity, we're not re-numbering the displayed "Lien WAN X" titles
            drawNetwork();
            updateStats(); // Clear stats for removed link
        });
    }
    
    function updateWanLinkSiteSelectors() {
        document.querySelectorAll('.wan-link-config').forEach(div => {
            const linkId = div.dataset.linkId;
            const link = wanLinks.find(l => l.id === linkId);
            if (!link) return;

            const sourceSelect = div.querySelector('.link-source-site');
            const targetSelect = div.querySelector('.link-target-site');
            
            const currentSourceVal = sourceSelect.value;
            const currentTargetVal = targetSelect.value;

            let siteOptions = '';
            sites.forEach((s, i) => {
                siteOptions += `<option value="${i}">${s.name}</option>`;
            });
            sourceSelect.innerHTML = siteOptions;
            targetSelect.innerHTML = siteOptions;

            // Try to preserve selection, default if site no longer exists
            sourceSelect.value = (currentSourceVal < sites.length) ? currentSourceVal : "0";
            targetSelect.value = (currentTargetVal < sites.length && sites.length > 1) ? currentTargetVal : (sites.length > 1 ? "1" : "0");
            
            link.sourceSiteIndex = parseInt(sourceSelect.value);
            link.targetSiteIndex = parseInt(targetSelect.value);
        });
        drawNetwork();
    }


    addWanLinkBtn.addEventListener('click', () => {
        if (sites.length < 2) {
            alert("Veuillez configurer au moins 2 succursales avant d'ajouter des liens WAN.");
            return;
        }
        addWanLinkUI();
    });


    // --- Drawing ---
    function drawNetwork() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw WAN Links first (as background)
        wanLinks.forEach(link => {
            if (link.sourceSiteIndex >= sites.length || link.targetSiteIndex >= sites.length || link.sourceSiteIndex === link.targetSiteIndex) return; // Invalid link
            
            const sourceSite = sites[link.sourceSiteIndex];
            const targetSite = sites[link.targetSiteIndex];

            ctx.beginPath();
            ctx.moveTo(sourceSite.cpe.x, sourceSite.cpe.y);
            ctx.lineTo(targetSite.cpe.x, targetSite.cpe.y);
            ctx.strokeStyle = link.color;
            ctx.lineWidth = 2 + link.packetsOnLink * 0.5; // Thicker if active
            // Glow effect for active links
            if (link.packetsOnLink > 0) {
                 ctx.shadowColor = link.color;
                 ctx.shadowBlur = 10;
            }
            ctx.stroke();
            ctx.shadowBlur = 0; // Reset shadow

            // Link info
            const midX = (sourceSite.cpe.x + targetSite.cpe.x) / 2;
            const midY = (sourceSite.cpe.y + targetSite.cpe.y) / 2;
            ctx.fillStyle = link.color;
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${link.type} (W:${link.weight})`, midX, midY - 5);
        });

        // Draw Sites (CPEs and Hosts)
        sites.forEach(site => {
            // Draw Site/CPE
            ctx.beginPath();
            ctx.arc(site.cpe.x, site.cpe.y, site.cpe.radius, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(0, 150, 255, 0.7)'; // CPE color
            ctx.fill();
            ctx.strokeStyle = '#00BFFF';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('CPE', site.cpe.x, site.cpe.y);
            
            // Site Name
            ctx.fillStyle = '#E0E0E0';
            ctx.font = 'bold 12px Arial';
            ctx.fillText(site.name, site.x, site.y - site.radius - 15);


            // Draw Hosts and connections to CPE
            site.hosts.forEach(host => {
                // Line from host to CPE
                ctx.beginPath();
                ctx.moveTo(host.x, host.y);
                ctx.lineTo(site.cpe.x, site.cpe.y);
                ctx.strokeStyle = 'rgba(150, 150, 150, 0.5)';
                ctx.lineWidth = 1;
                ctx.stroke();

                // Host
                ctx.beginPath();
                ctx.arc(host.x, host.y, host.radius, 0, 2 * Math.PI);
                ctx.fillStyle = 'rgba(0, 200, 0, 0.7)'; // Host color
                ctx.fill();
                ctx.strokeStyle = '#00FF00';
                ctx.stroke();
            });
        });
    }

    function drawPackets() {
        packets.forEach(packet => {
            ctx.beginPath();
            ctx.arc(packet.x, packet.y, packet.radius, 0, 2 * Math.PI);
            ctx.fillStyle = packet.color;
            ctx.fill();
            // Optional: add a small border or glow to packets
            // ctx.strokeStyle = "white";
            // ctx.lineWidth = 0.5;
            // ctx.stroke();
        });
    }

    // --- Simulation Logic ---
    let rrLinkIndex = 0;
    let wrrCurrentWeights = [];
    let wrrStructure = []; // For weighted round robin selection

    function prepareWRRStructure() {
        wrrStructure = [];
        wanLinks.forEach((link, index) => {
            if (link.sourceSiteIndex === link.targetSiteIndex) return; // Skip self-loops
            for (let i = 0; i < link.weight; i++) {
                wrrStructure.push(index); // Store link index
            }
        });
        // Shuffle for better initial distribution, though strict WRR cycles through this
        // For visual, cycling is better to show the pattern
        rrLinkIndex = 0; // Reset index for WRR structure as well
    }


    function selectLink(sourceSite, targetSite) { // Parameters not used yet, but could be for multi-CPE scenarios
        const algorithm = algorithmSelect.value;
        const availableLinks = wanLinks.filter(link => 
            (sites[link.sourceSiteIndex] && sites[link.targetSiteIndex]) && // Ensure sites exist
            link.sourceSiteIndex !== link.targetSiteIndex // Ensure not a self-loop for traffic
        );

        if (availableLinks.length === 0) return null;

        let selectedLink;

        if (algorithm === 'round-robin') {
            selectedLink = availableLinks[rrLinkIndex % availableLinks.length];
            rrLinkIndex++;
        } else if (algorithm === 'weighted-round-robin') {
            if (wrrStructure.length === 0) prepareWRRStructure(); // Prepare if not already
            if (wrrStructure.length === 0) return availableLinks[0] || null; // Fallback if still no valid links after prep

            const linkIndexInWanLinksArray = wrrStructure[rrLinkIndex % wrrStructure.length];
            selectedLink = wanLinks[linkIndexInWanLinksArray]; // Get the actual link object
            rrLinkIndex++;
        }
        return selectedLink;
    }

    function createPacket() {
        if (sites.length < 2) return; // Need at least two sites

        const sourceSiteIndex = Math.floor(Math.random() * sites.length);
        let targetSiteIndex = Math.floor(Math.random() * sites.length);
        while (targetSiteIndex === sourceSiteIndex) {
            targetSiteIndex = Math.floor(Math.random() * sites.length);
        }

        const sourceSite = sites[sourceSiteIndex];
        const targetSite = sites[targetSiteIndex];
        
        if (sourceSite.hosts.length === 0) return; // No hosts to send from
        const sourceHost = sourceSite.hosts[Math.floor(Math.random() * sourceSite.hosts.length)];

        const link = selectLink(sourceSite, targetSite);
        if (!link) return; // No available link

        // Ensure the chosen link actually connects the sourceSite's CPE to the targetSite's CPE (or vice-versa for bi-directional)
        // For simplicity, this simulation assumes links are bi-directional or that selectLink already picked a valid one.
        // A more robust check:
        const linkConnectsSourceToTarget = (link.sourceSiteIndex === sourceSiteIndex && link.targetSiteIndex === targetSiteIndex);
        const linkConnectsTargetToSource = (link.sourceSiteIndex === targetSiteIndex && link.targetSiteIndex === sourceSiteIndex);

        if (!linkConnectsSourceToTarget && !linkConnectsTargetToSource) {
             // The selected link (e.g. by global RR) might not be between these specific sites.
             // Find a link that IS between these sites, or skip packet.
             // For this demo, we assume selectLink logic is sufficient or traffic is "any-to-any" via selected link.
             // This logic gets complex with specific site-to-site paths and global LB.
             // The current model: packets go from a source host to its CPE, then via *any* selected WAN link
             // to the CPE of the *link's target site*, then to that site.
             // So, the packet's "target site" becomes the link's target site.
            
            // If the link's source is our sourceSite, then packet's destination is link's target.
            // If the link's target is our sourceSite, then packet's destination is link's source (assuming bidirectional link).
            let finalTargetSite;
            if (link.sourceSiteIndex === sourceSiteIndex) {
                finalTargetSite = sites[link.targetSiteIndex];
            } else if (link.targetSiteIndex === sourceSiteIndex) { // Link used in reverse
                finalTargetSite = sites[link.sourceSiteIndex];
            } else {
                // This case means the selected link does not involve the sourceSite at all.
                // This can happen if global RR picks a link between site C and D, but packet source is site A.
                // For SD-WAN, this means site A sends to its CPE, which then routes over the globally selected link.
                // So the packet's "effective" destination site is the target of the WAN link.
                // For simplicity, let's just use the link's configured target.
                finalTargetSite = sites[link.targetSiteIndex];
            }
             if (!finalTargetSite || finalTargetSite === sourceSite) return; // Avoid sending to self or invalid target

             targetSite = finalTargetSite; // Override packet's initial targetSite based on link
        }


        packetIdCounter++;
        packetsSentCount++;
        link.totalPacketsSent = (link.totalPacketsSent || 0) + 1;
        link.packetsOnLink = (link.packetsOnLink || 0) + 1;

        const packet = {
            id: packetIdCounter,
            sourceHost: sourceHost,
            sourceCPE: sourceSite.cpe,
            targetCPE: targetSite.cpe, // Destination CPE is on the target site of the link
            targetSite: targetSite,
            link: link,
            x: sourceHost.x,
            y: sourceHost.y,
            radius: 4,
            color: link.color, // Packet takes color of the link
            progress: 0, // 0 to 100
            stage: 'to-source-cpe', // 'to-source-cpe', 'on-wan', 'to-target-host' (simplified)
            animationSpeed: parseFloat(animationSpeedSlider.value) / 1000 // Slower animation
        };
        packets.push(packet);
        updateStats();
    }

    function updatePackets() {
        for (let i = packets.length - 1; i >= 0; i--) {
            const packet = packets[i];
            packet.progress += packet.animationSpeed * 5; // Adjust multiplier for speed

            if (packet.stage === 'to-source-cpe') {
                const dx = packet.sourceCPE.x - packet.sourceHost.x;
                const dy = packet.sourceCPE.y - packet.sourceHost.y;
                if (packet.progress >= 100) {
                    packet.x = packet.sourceCPE.x;
                    packet.y = packet.sourceCPE.y;
                    packet.progress = 0;
                    packet.stage = 'on-wan';
                } else {
                    packet.x = packet.sourceHost.x + dx * (packet.progress / 100);
                    packet.y = packet.sourceHost.y + dy * (packet.progress / 100);
                }
            } else if (packet.stage === 'on-wan') {
                // Determine actual start/end points of the link for this packet's direction
                let wanStartX, wanStartY, wanEndX, wanEndY;
                // Check if packet sourceCPE is the link's defined source or target to determine direction
                if (packet.sourceCPE.x === sites[packet.link.sourceSiteIndex].cpe.x && 
                    packet.sourceCPE.y === sites[packet.link.sourceSiteIndex].cpe.y) {
                    wanStartX = sites[packet.link.sourceSiteIndex].cpe.x;
                    wanStartY = sites[packet.link.sourceSiteIndex].cpe.y;
                    wanEndX = sites[packet.link.targetSiteIndex].cpe.x;
                    wanEndY = sites[packet.link.targetSiteIndex].cpe.y;
                } else { // Packet is going "reverse" on the defined link
                    wanStartX = sites[packet.link.targetSiteIndex].cpe.x;
                    wanStartY = sites[packet.link.targetSiteIndex].cpe.y;
                    wanEndX = sites[packet.link.sourceSiteIndex].cpe.x;
                    wanEndY = sites[packet.link.sourceSiteIndex].cpe.y;
                }

                const dx = wanEndX - wanStartX;
                const dy = wanEndY - wanStartY;

                if (packet.progress >= 100) {
                    packet.x = wanEndX;
                    packet.y = wanEndY; // Arrived at target CPE
                    packet.progress = 0;
                    packet.stage = 'to-target-host'; 
                    packet.link.packetsOnLink = Math.max(0, (packet.link.packetsOnLink || 0) - 1);
                    // Pick a random host in target site
                    if (packet.targetSite.hosts.length > 0) {
                        packet.finalHostDest = packet.targetSite.hosts[Math.floor(Math.random() * packet.targetSite.hosts.length)];
                    } else { // No hosts, packet disappears at CPE
                         packets.splice(i, 1);
                         continue;
                    }
                } else {
                    packet.x = wanStartX + dx * (packet.progress / 100);
                    packet.y = wanStartY + dy * (packet.progress / 100);
                }
            } else if (packet.stage === 'to-target-host') {
                 if (!packet.finalHostDest) { // Should have been set
                    packets.splice(i, 1); // Remove if no host to go to
                    continue;
                 }
                const dx = packet.finalHostDest.x - packet.targetCPE.x;
                const dy = packet.finalHostDest.y - packet.targetCPE.y;
                if (packet.progress >= 100) {
                    packets.splice(i, 1); // Packet arrived and removed
                } else {
                    packet.x = packet.targetCPE.x + dx * (packet.progress / 100);
                    packet.y = packet.targetCPE.y + dy * (packet.progress / 100);
                }
            }
        }
    }

    function gameLoop() {
        if (!simulationRunning) return;

        updatePackets();
        drawNetwork(); // Redraw static elements and link states
        drawPackets(); // Draw moving packets

        const totalPacketsToSend = parseInt(totalPacketsInput.value);
        if (totalPacketsToSend > 0 && packetsSentCount >= totalPacketsToSend && packets.length === 0) {
            stopSimulation();
            updateStats(); // Final update
            alert("Simulation terminée: Nombre total de paquets envoyés atteint.");
            return;
        }

        animationFrameId = requestAnimationFrame(gameLoop);
    }

    // --- Controls ---
    packetRateSlider.addEventListener('input', (e) => {
        packetRateValueSpan.textContent = e.target.value;
        if (simulationRunning) { // Adjust interval if running
            clearInterval(packetGenerationIntervalId);
            const rate = parseInt(packetRateSlider.value);
            packetGenerationIntervalId = setInterval(createPacket, 1000 / rate);
        }
    });
    animationSpeedSlider.addEventListener('input', (e) => {
        animationSpeedValueSpan.textContent = e.target.value;
        const newSpeed = parseFloat(e.target.value) / 1000;
        packets.forEach(p => p.animationSpeed = newSpeed); // Update existing packets too
    });

    startButton.addEventListener('click', () => {
        if (simulationRunning) return;
        if (sites.length < 2) {
            alert("Veuillez configurer au moins 2 succursales.");
            return;
        }
        if (wanLinks.filter(l => l.sourceSiteIndex !== l.targetSiteIndex).length === 0) {
            alert("Veuillez configurer au moins 1 lien WAN valide entre des succursales différentes.");
            return;
        }

        simulationRunning = true;
        startButton.disabled = true;
        stopButton.disabled = false;
        applyNetworkConfigBtn.disabled = true;
        addWanLinkBtn.disabled = true;
        document.querySelectorAll('#wanLinksConfigContainer input, #wanLinksConfigContainer select, #wanLinksConfigContainer button').forEach(el => el.disabled = true);


        packets = [];
        packetsSentCount = 0;
        packetIdCounter = 0;
        rrLinkIndex = 0;
        wanLinks.forEach(link => {
            link.totalPacketsSent = 0;
            link.packetsOnLink = 0;
        });
        prepareWRRStructure(); // Prepare for WRR if selected

        const rate = parseInt(packetRateSlider.value);
        if (rate > 0) {
            createPacket(); // Create one immediately
            packetGenerationIntervalId = setInterval(createPacket, 1000 / rate);
        }
        
        animationFrameId = requestAnimationFrame(gameLoop);
        updateStats();
    });

    stopButton.addEventListener('click', stopSimulation);

    function stopSimulation() {
        simulationRunning = false;
        startButton.disabled = false;
        stopButton.disabled = true;
        applyNetworkConfigBtn.disabled = false;
        addWanLinkBtn.disabled = false;
        document.querySelectorAll('#wanLinksConfigContainer input, #wanLinksConfigContainer select, #wanLinksConfigContainer button').forEach(el => el.disabled = false);


        clearInterval(packetGenerationIntervalId);
        cancelAnimationFrame(animationFrameId);
        updateStats(); // Final update
    }

    // --- Statistics ---
    function updateStats() {
        if (wanLinks.length === 0 && packetsSentCount === 0) {
            statsContent.innerHTML = '<p class="text-gray-400">Aucun lien WAN configuré ou simulation non démarrée.</p>';
            if(statsChart) {
                statsChart.destroy();
                statsChart = null;
            }
            return;
        }

        let html = `<p class="text-gray-300">Total Paquets Générés: ${packetsSentCount}</p>`;
        html += `<p class="text-gray-300">Paquets en transit: ${packets.length}</p>`;
        
        const labels = [];
        const data = [];
        const backgroundColors = [];
        const borderColors = [];
        let totalWeight = 0;
        if (algorithmSelect.value === 'weighted-round-robin') {
            wanLinks.forEach(link => {
                 if (link.sourceSiteIndex !== link.targetSiteIndex) totalWeight += link.weight;
            });
        }


        wanLinks.forEach((link, index) => {
            if (link.sourceSiteIndex >= sites.length || link.targetSiteIndex >= sites.length) return; // Skip invalid links after site removal
            
            const linkName = `Lien ${index + 1} (${link.type}: ${sites[link.sourceSiteIndex].name.split(' ')[1]}↔${sites[link.targetSiteIndex].name.split(' ')[1]})`;
            const packetsOnThisLink = link.totalPacketsSent || 0;
            const percentage = packetsSentCount > 0 ? ((packetsOnThisLink / packetsSentCount) * 100).toFixed(2) : 0;
            
            html += `<div class="p-2 bg-gray-700 rounded mt-1">`;
            html += `<strong style="color:${link.color};">${linkName}</strong>: ${packetsOnThisLink} paquets (${percentage}%)`;

            if (algorithmSelect.value === 'weighted-round-robin' && totalWeight > 0 && link.sourceSiteIndex !== link.targetSiteIndex) {
                const theoreticalRatio = ((link.weight / totalWeight) * 100).toFixed(2);
                html += ` (Théorique: ${theoreticalRatio}%)`;
                const diff = Math.abs(percentage - theoreticalRatio);
                if (packetsSentCount > 20 && diff > 5) { // Arbitrary threshold for "significant" deviation
                     html += ` <span class="text-yellow-400">(Écart: ${diff.toFixed(2)}%)</span>`;
                } else if (packetsSentCount > 20) {
                    html += ` <span class="text-green-400">(Conforme)</span>`;
                }
            }
            html += `</div>`;

            labels.push(linkName);
            data.push(packetsOnThisLink);
            backgroundColors.push(link.color + 'B3'); // Add alpha for background
            borderColors.push(link.color);
        });
        statsContent.innerHTML = html;

        // Chart.js update
        if (statsChart) {
            statsChart.data.labels = labels;
            statsChart.data.datasets[0].data = data;
            statsChart.data.datasets[0].backgroundColor = backgroundColors;
            statsChart.data.datasets[0].borderColor = borderColors;
            statsChart.update();
        } else if (labels.length > 0) {
            statsChart = new Chart(statsChartCanvas, {
                type: 'bar', // 'pie' or 'bar'
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Paquets par Lien',
                        data: data,
                        backgroundColor: backgroundColors,
                        borderColor: borderColors,
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false // Can be true if preferred
                        },
                        title: {
                             display: true,
                             text: 'Répartition des Paquets par Lien WAN',
                             color: '#E0E0E0'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { color: '#E0E0E0' },
                            grid: { color: '#4A5568' }
                        },
                        x: {
                            ticks: { color: '#E0E0E0' },
                            grid: { color: '#4A5568' }
                        }
                    }
                }
            });
        }
    }

    // --- Initial Setup Call ---
    function initialSetup() {
        resizeCanvas(); // Set initial canvas size
        applyNetworkConfigHandler(); // Initialize network based on default dropdowns
        
        // Add a couple of default WAN links for quick start
        if (sites.length >= 2) {
            addWanLinkUI(); // Add first default link
            if (sites.length >=2) { // Add a second if possible, connecting different sites or same with different type
                 const secondLinkData = JSON.parse(JSON.stringify(defaultLinkTypes[1])); // Deep copy
                 secondLinkData.id = `wanlink-${linkIdCounter++}`;
                 secondLinkData.sourceSiteIndex = 0;
                 secondLinkData.targetSiteIndex = sites.length > 1 ? 1 : 0; // Ensure it's a valid connection
                 if (wanLinks.length > 0 && wanLinks[0].sourceSiteIndex === secondLinkData.sourceSiteIndex && wanLinks[0].targetSiteIndex === secondLinkData.targetSiteIndex) {
                    // If it's the same path as the first link, try to vary it
                    if (sites.length > 2) secondLinkData.targetSiteIndex = 2;
                    else if (sites.length === 2 && secondLinkData.sourceSiteIndex === 0) secondLinkData.sourceSiteIndex = 1; // Just an attempt to vary
                 }
                 wanLinks.push(secondLinkData);
                 addWanLinkUI(secondLinkData); // Add UI for this pre-configured link
            }
        }
        updateStats(); // Initial empty state for stats
    }

    initialSetup();
});