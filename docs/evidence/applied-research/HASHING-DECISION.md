# Applied decision: full-byte hashing backend

The first matched SHA256 trial passed warm wall latency (conservative 133.99x)
and failed CPU (87.50x). It did not demonstrate 100x overall research value.
Tool binaries dominate fingerprint cost. On this host, three reads of Chromium
with SHA256 took 0.143-0.157 seconds each; BLAKE3 1.0.8 took 0.051-0.053.

Apply BLAKE3 as an explicit optional backend, keep SHA256 as the default, and
bind the backend implementation independently with SHA256. This is an applied
optimization of the same full-byte proof, not permission to reuse from mtimes.
Run the full matched trial again; the microbenchmark does not establish the
end-to-end CPU target. A fresh host/runtime still requires full setup.
