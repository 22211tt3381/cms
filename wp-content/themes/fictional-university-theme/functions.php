<?php
function load_assets()
{
    wp_enqueue_style("font", "//fonts.googleapis.com/css?family=Roboto+Condensed:300,300i,400,400i,700,700i|Roboto:100,300,400,400i,700,700i", array(), '1.0', 'all');
    wp_enqueue_style("bootstrapcss", "//maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css", array(), '1.1', 'all');
    wp_enqueue_style("maincss", get_theme_file_uri() . '/build/index.css', array(), '1.0.2', 'all');
    wp_enqueue_style("mainstylecss", get_theme_file_uri() . '/build/style-index.css', array(), '1.0.3', 'all');
    wp_enqueue_script("university_scripts", get_theme_file_uri() . '/build/index.js', array('jquery'), '1.02', true);
}
add_action("wp_enqueue_scripts", "load_assets");

function add_menu()
{
    add_theme_support('menus');
    register_nav_menus(array(
        'themeLocationOne' => 'Theme Footer menu One',
        'themeLocationTwo' => 'Theme Footer menu Two',
        'themeLocationTree' => 'Theme Footer menu Tree'
    ));
}
// Thêm menu vào wordpress -> footer
add_action("init", "add_menu");



// Ví dụ về Filter Hook
add_filter('nav_menu_css_class', 'my_custom_menu_classes', 10, 2);

function my_custom_menu_classes($classes, $item) {
    // Thêm lớp CSS cho mỗi mục menu
    $classes[] = 'my-custom-class';
    return $classes;
}



// Thêm action hook active_blog
function my_custom_blog_activation_function($blog_id) {
    // Thực hiện chức năng khi blog được kích hoạt
    error_log('Blog with ID ' . $blog_id . ' has been activated.');
    
}
add_action('active_blog', 'my_custom_blog_activation_function');

// Ví dụ kích hoạt hook
function activate_new_blog($blog_id) {
    // Gọi action hook active_blog khi blog được kích hoạt
    do_action('active_blog', $blog_id);
}

// Giả sử bạn kích hoạt blog với ID là 1
activate_new_blog(1);



