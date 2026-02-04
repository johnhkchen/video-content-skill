# Self-Host: Own the Stack

For those who prefer understanding and controlling infrastructure over managed services.

---

## Simple: nginx + VPS

The minimal viable self-hosted video CDN.

```nginx
# /etc/nginx/sites-available/videos
server {
    listen 443 ssl http2;
    server_name videos.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/videos.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/videos.yourdomain.com/privkey.pem;

    root /var/www/videos;

    location / {
        add_header Access-Control-Allow-Origin *;
        add_header Cache-Control "public, max-age=31536000, immutable";

        # Enable range requests for video seeking
        add_header Accept-Ranges bytes;
    }

    # Optional: basic bandwidth limiting
    location ~* \.(mp4|webm)$ {
        limit_rate_after 5m;
        limit_rate 800k;
    }
}
```

**Setup:**
```bash
# On a fresh Ubuntu VPS
apt update && apt install -y nginx certbot python3-certbot-nginx
certbot --nginx -d videos.yourdomain.com
mkdir -p /var/www/videos
# Upload your videos via scp/rsync
```

**Costs:**
- $5-10/mo VPS (DigitalOcean, Hetzner, Linode, Vultr)
- Bandwidth: 1-5TB usually included
- You control everything

---

## When Self-Hosting Makes Sense

✅ **Good fit:**
- You already run servers
- Traffic is predictable (not viral spikes)
- You want to learn infrastructure
- Vendor lock-in concerns
- Compliance/sovereignty requirements
- You enjoy ops work

❌ **Bad fit:**
- You don't want to manage servers
- Traffic could spike (VPS overage is expensive)
- Need global CDN performance
- Uptime is critical without ops experience

---

## Middle Ground: VPS + Cloudflare CDN

Best of both: control your origin, get free CDN caching.

1. Set up VPS with nginx (as above)
2. Add domain to Cloudflare (free tier)
3. Point DNS through Cloudflare
4. Enable caching

Cloudflare caches video at edge, your VPS barely gets hit. Zero egress cost on the CDN layer.

---

## Full Stack: "It's All Claude Chores Anyway"

For those who want to own everything—distributed storage, load balancing, CDN—using open source.

### The Stack
- **MinIO** or **Ceph** - S3-compatible distributed storage
- **HAProxy** or **nginx** - Load balancing
- **Varnish** - CDN/caching layer
- **Let's Encrypt** - TLS

### MinIO (Simpler)

Single node for dev/small scale:
```bash
docker run -p 9000:9000 -p 9001:9001 \
  -v /data:/data \
  -e MINIO_ROOT_USER=admin \
  -e MINIO_ROOT_PASSWORD=changeme123 \
  minio/minio server /data --console-address ":9001"
```

Now you have S3-compatible storage. Use any S3 SDK/CLI with `--endpoint-url http://localhost:9000`.

Distributed (3+ nodes):
```bash
# On each node
minio server http://node{1...4}/data{1...4}
```

### Ceph (Production-Grade)

For serious distributed storage with replication:
```bash
# Using cephadm (requires 3+ nodes for HA)
cephadm bootstrap --mon-ip <your-ip>
ceph orch apply osd --all-available-devices
ceph orch apply rgw default  # S3-compatible gateway
```

### Varnish CDN Layer

```vcl
# /etc/varnish/default.vcl
vcl 4.0;

backend default {
    .host = "127.0.0.1";
    .port = "9000";  # MinIO/Ceph RGW
}

sub vcl_backend_response {
    if (bereq.url ~ "\.(mp4|webm)$") {
        set beresp.ttl = 30d;
        set beresp.http.Cache-Control = "public, max-age=2592000";
        # Don't cache partial responses (range requests)
        if (beresp.http.Content-Range) {
            set beresp.uncacheable = true;
        }
    }
}

sub vcl_recv {
    # Pass range requests to backend
    if (req.http.Range) {
        return (pass);
    }
}
```

### HAProxy Load Balancing

```haproxy
# /etc/haproxy/haproxy.cfg
frontend video_cdn
    bind *:443 ssl crt /etc/ssl/certs/video.pem
    default_backend origins

    # Health check endpoint
    acl health path /health
    use_backend health_check if health

backend origins
    balance roundrobin
    option httpchk GET /minio/health/live
    server origin1 10.0.1.10:9000 check
    server origin2 10.0.2.10:9000 check
    server origin3 10.0.3.10:9000 check backup
```

---

## Realistic Costs at Scale

**Small (single VPS):**
- Hetzner CX21: €5/mo, 20TB bandwidth
- Good for: Personal projects, small apps

**Medium (3-node cluster):**
- 3x Hetzner CPX31: €40/mo total
- ~500GB usable storage with replication
- Good for: Startups, medium traffic

**Large (dedicated servers):**
- 3x Hetzner AX41: ~€150/mo total
- 100TB+ usable storage
- Unlimited bandwidth (unmetered)
- Good for: Serious scale, cost optimization

---

## The Honest Truth

This is a real option if you're the kind of person who:
- Runs their own mail server
- Thinks Kubernetes is fun
- Wants to understand every layer
- Has compliance requirements that demand it

For everyone else, managed services exist for good reasons. But if Claude can scaffold this infrastructure for you, the operational burden drops—it becomes "Claude chores" rather than "hire a platform team."

---

## When to Use What

| Scale | Recommended |
|-------|-------------|
| Demo/hackathon | R2 or Cloudinary (managed) |
| Small app | VPS + Cloudflare CDN |
| Medium, predictable | MinIO cluster |
| Large, cost-sensitive | Ceph + Varnish |
| Sovereignty required | Full self-host |
