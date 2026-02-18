<?php

namespace Database\Seeders;

use App\Models\News;
use App\Models\User;
use Illuminate\Database\Seeder;

class NewsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get admin user
        $admin = User::whereHas('roles', fn($q) => $q->where('name', 'admin'))->first();
        
        if (!$admin) {
            $this->command->error('Admin user not found. Please run DatabaseSeeder first.');
            return;
        }

        $newsItems = [
            [
                'title' => 'Whiteboard Templates By Industry Leaders',
                'content' => '<p>Presenting a comprehensive guide to whiteboard templates used by industry leaders. These templates are designed to enhance collaboration and productivity across teams.</p><p>Learn how top companies use visual planning tools to streamline their processes and improve communication. From project planning to brainstorming sessions, these templates cover all aspects of team collaboration.</p>',
                'status' => 'published',
                'meta_title' => 'Industry Leading Whiteboard Templates',
                'meta_description' => 'Discover whiteboard templates used by top industry leaders to boost team productivity',
                'meta_keywords' => 'whiteboard,templates,productivity,collaboration',
            ],
            [
                'title' => 'Tesla Announces New Roadster',
                'content' => '<p>Tesla has unveiled plans for its next-generation Roadster, promising unprecedented performance and range. The new electric sports car is set to redefine what\'s possible in the EV market.</p><p>With claimed 0-60 mph times under 2 seconds and a range of over 600 miles, this vehicle represents a significant leap forward in electric vehicle technology. Pre-orders are now being accepted.</p>',
                'status' => 'published',
                'meta_title' => 'New Tesla Roadster Announcement',
                'meta_description' => 'Tesla unveils next-generation Roadster with groundbreaking performance',
                'meta_keywords' => 'tesla,roadster,electric,vehicle,technology',
            ],
            [
                'title' => 'Professional Development in Modern Workplace',
                'content' => '<p>An in-depth look at professional development strategies that work in today\'s rapidly evolving workplace. This guide covers essential skills and approaches for career growth.</p><p>From remote work adaptation to digital literacy, modern professionals need a diverse skill set. Discover the key areas to focus on for continued career advancement and workplace success.</p>',
                'status' => 'published',
                'meta_title' => 'Modern Professional Development Guide',
                'meta_description' => 'Essential strategies for professional development in the modern workplace',
                'meta_keywords' => 'professional,development,career,skills,workplace',
            ],
            [
                'title' => 'Minimalist Living in Urban Spaces',
                'content' => '<p>Exploring the principles of minimalist living and how they apply to urban apartment dwellers. Learn to create a peaceful, organized space even in limited square footage.</p><p>Discover practical tips for decluttering, space optimization, and mindful consumption. Transform your urban living space into a minimalist haven that promotes well-being and productivity.</p>',
                'status' => 'published',
                'meta_title' => 'Urban Minimalist Living Guide',
                'meta_description' => 'How to embrace minimalist living in small urban spaces',
                'meta_keywords' => 'minimalist,urban,living,declutter,space',
            ],
            [
                'title' => 'Photography Techniques for Beginners',
                'content' => '<p>A comprehensive introduction to photography for those just starting their journey. Learn the fundamental techniques that will set you up for success.</p><p>From understanding exposure and composition to mastering light and color, this guide covers everything a beginner needs to know. Start capturing stunning images with your camera or smartphone today.</p>',
                'status' => 'published',
                'meta_title' => 'Beginner Photography Techniques',
                'meta_description' => 'Essential photography techniques for beginners to master',
                'meta_keywords' => 'photography,beginners,techniques,camera,skills',
            ],
            [
                'title' => 'Healthy Meal Prep for Busy Professionals',
                'content' => '<p>Time-saving meal preparation strategies for busy professionals who want to maintain a healthy diet. Learn how to plan, shop, and cook efficiently.</p><p>Discover recipes and techniques that let you prepare a week\'s worth of nutritious meals in just a few hours. Say goodbye to unhealthy takeout and hello to convenient, homemade nutrition.</p>',
                'status' => 'published',
                'meta_title' => 'Meal Prep Guide for Professionals',
                'meta_description' => 'Healthy meal prep strategies for busy working professionals',
                'meta_keywords' => 'meal,prep,healthy,cooking,nutrition',
            ],
            [
                'title' => 'Remote Work Best Practices 2025',
                'content' => '<p>The definitive guide to remote work in 2025, covering the latest tools, techniques, and strategies for distributed teams. Learn how to thrive in a remote-first environment.</p><p>From communication protocols to productivity hacks, this comprehensive guide covers everything remote workers and managers need to know for success in the modern workplace.</p>',
                'status' => 'published',
                'meta_title' => 'Remote Work Best Practices 2025',
                'meta_description' => 'Complete guide to remote work best practices for 2025',
                'meta_keywords' => 'remote,work,practices,productivity,2025',
            ],
            [
                'title' => 'Sustainable Fashion Trends',
                'content' => '<p>Exploring the latest trends in sustainable and ethical fashion. Learn how to build a wardrobe that\'s both stylish and environmentally responsible.</p><p>Discover brands leading the way in sustainable practices, tips for extending the life of your clothes, and how to make more conscious fashion choices without sacrificing style.</p>',
                'status' => 'draft',
                'meta_title' => 'Sustainable Fashion Trends Guide',
                'meta_description' => 'Latest trends in sustainable and ethical fashion',
                'meta_keywords' => 'fashion,sustainable,ethical,trends,style',
            ],
        ];

        foreach ($newsItems as $item) {
            News::create([
                'user_id' => $admin->id,
                'title' => $item['title'],
                'content' => $item['content'],
                'status' => $item['status'],
                'meta_title' => $item['meta_title'],
                'meta_description' => $item['meta_description'],
                'meta_keywords' => $item['meta_keywords'],
            ]);
        }

        $this->command->info('News seeded successfully!');
    }
}
