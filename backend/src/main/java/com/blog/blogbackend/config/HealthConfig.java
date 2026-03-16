package com.blog.blogbackend.config;

import org.springframework.boot.actuator.health.Health;
import org.springframework.boot.actuator.health.HealthIndicator;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Autowired;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

@Component
public class HealthConfig implements HealthIndicator {

    @Autowired
    private DataSource dataSource;

    @Override
    public Health health() {
        try (Connection connection = dataSource.getConnection()) {
            if (connection.isValid(1)) {
                return Health.up()
                        .withDetail("database", "Available")
                        .withDetail("status", "UP")
                        .build();
            } else {
                return Health.down()
                        .withDetail("database", "Connection invalid")
                        .withDetail("status", "DOWN")
                        .build();
            }
        } catch (SQLException e) {
            return Health.down()
                    .withDetail("database", "Connection failed")
                    .withDetail("error", e.getMessage())
                    .withDetail("status", "DOWN")
                    .build();
        }
    }
}