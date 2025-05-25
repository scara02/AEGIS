FROM fluent/fluentd:v1.16-1

USER root
RUN fluent-gem install fluent-plugin-influxdb-v2 -v 1.10.0

USER fluent

COPY fluentd.conf /fluentd/etc/fluent.conf