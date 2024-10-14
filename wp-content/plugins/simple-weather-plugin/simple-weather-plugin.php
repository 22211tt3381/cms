<?php
/*
Plugin Name: Simple Weather Display
Description: A simple plugin to display weather information for a specific city, including country name.
Version: 1.1
Author: Nhom1
*/

function simple_weather_display() {
    ob_start();

    // Xử lý khi người dùng gửi biểu mẫu
    if (isset($_POST['submit'])) {
        $city = sanitize_text_field($_POST['city']);
        $api_key = '2f6b1633ea61db2584f8b83653767043'; // API Key của bạn
        $api_url = "https://api.openweathermap.org/data/2.5/weather?q=" . urlencode($city) . "&appid={$api_key}&units=metric";

        $response = wp_remote_get($api_url);

        if (is_wp_error($response)) {
            echo '<p>Không thể truy xuất dữ liệu thời tiết. Vui lòng thử lại sau.</p>';
        } else {
            $body = wp_remote_retrieve_body($response);
            $data = json_decode($body, true);

            if (!isset($data['cod']) || $data['cod'] != 200) {
                echo '<p>Không tìm thấy thành phố. Vui lòng kiểm tra lại tên thành phố và thử lại.</p>';
            } else {
                $temperature = isset($data['main']['temp']) ? $data['main']['temp'] : 'N/A';
                $description = isset($data['weather'][0]['description']) ? $data['weather'][0]['description'] : 'N/A';
                $country = isset($data['sys']['country']) ? $data['sys']['country'] : 'N/A';
                echo "<h2>Thời tiết ở {$city}, {$country}</h2>
                      <p>Nhiệt độ: {$temperature} °C</p>
                      <p>Mô tả: " . ucfirst($description) . "</p>";
            }
        }
    }

    // Biểu mẫu tìm kiếm
    ?>
    <form method="post">
        <label for="city">Nhập tên thành phố:</label>
        <input type="text" id="city" name="city" required>
        <input type="submit" name="submit" value="Xem thời tiết">
    </form>
    <?php

    return ob_get_clean();
}

// Đăng ký shortcode
add_shortcode('simple_weather', 'simple_weather_display');