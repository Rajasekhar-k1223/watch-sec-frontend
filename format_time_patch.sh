#!/bin/bash
cat << 'PATCH_EOF' > /tmp/dashboard.patch
--- src/pages/Dashboard.tsx
+++ src/pages/Dashboard.tsx
@@ -201,6 +201,15 @@
                     const data = await res.json();
                     // Save the API trend separately so live Socket.IO points aren't wiped out on each poll
                     if (data.resources?.trend) {
+                        data.resources.trend = data.resources.trend.map((t: any) => {
+                            let dStr = t.full_date;
+                            if (dStr && !dStr.includes('T')) dStr = dStr.replace(' ', 'T');
+                            if (dStr && !dStr.includes('Z') && !dStr.match(/[+-]\d{2}/)) dStr += 'Z';
+                            const d = new Date(dStr);
+                            if (!isNaN(d.getTime())) {
+                                t.time = t.full_date.length <= 10 ? d.toLocaleDateString([], { month: 'short', day: 'numeric' }) : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
+                            }
+                            return t;
+                        });
                         apiTrendRef.current = data.resources.trend;
                         // Merge with any live points we already have
                         data.resources.trend = buildMergedTrend();
@@ -310,6 +319,10 @@
                     mem: payload.data.mem,
                     full_date: payload.data.full_date || new Date().toISOString()
                 };
+                const d = new Date(newPoint.full_date);
+                if (!isNaN(d.getTime())) {
+                    newPoint.time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
+                }
 
                 // Add to rolling live-points window (sliding, max MAX_LIVE_POINTS)
                 livePointsRef.current = [
PATCH_EOF
cd /opt/apps/monitorix/watch-sec-frontend && patch -p0 < /tmp/dashboard.patch
