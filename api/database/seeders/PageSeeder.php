<?php

namespace Database\Seeders;

use App\Models\Page;
use App\Models\User;
use Illuminate\Database\Seeder;

class PageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $adminUser = User::role('admin')->first();
        
        if (!$adminUser) {
            $this->command->error('No admin user found. Please create an admin user first.');
            return;
        }

        // Privacy Policy
        Page::create([
            'user_id' => $adminUser->id,
            'page_type' => 'privacy_policy',
            'page_title' => 'Privacy Policy',
            'page_content' => '
                <h1>Privacy Policy</h1>
                <p><strong>Last updated:</strong> ' . now()->format('F d, Y') . '</p>
                
                <h2>Information We Collect</h2>
                <p>We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support. This may include your name, email address, phone number, and other personal information you choose to provide.</p>
                
                <h2>How We Use Your Information</h2>
                <p>We use the information we collect to:</p>
                <ul>
                    <li>Provide, maintain, and improve our services</li>
                    <li>Process transactions and send related information</li>
                    <li>Send technical notices, updates, and support messages</li>
                    <li>Respond to your comments and questions</li>
                    <li>Personalize your experience and provide relevant content</li>
                    <li>Comply with legal obligations and protect our rights</li>
                </ul>
                
                <h2>Information Sharing</h2>
                <p>We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy. We may share your information with trusted service providers who assist us in operating our website and conducting our business.</p>
                
                <h2>Data Security</h2>
                <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure.</p>
                
                <h2>Your Rights</h2>
                <p>You have the right to access, update, or delete your personal information. You may also opt out of certain communications from us. To exercise these rights, please contact us using the information provided below.</p>
                
                <h2>Cookies and Tracking</h2>
                <p>We use cookies and similar tracking technologies to enhance your browsing experience and analyze website traffic. You can control cookie settings through your browser preferences.</p>
                
                <h2>Contact Us</h2>
                <p>If you have any questions about this Privacy Policy, please contact us at privacy@company.com or write to us at our registered address.</p>
            ',
        ]);

        // About Us
        Page::create([
            'user_id' => $adminUser->id,
            'page_type' => 'about_us',
            'page_title' => 'About Us',
            'page_content' => '
                <h1>About Us</h1>
                <p><strong>Last updated:</strong> ' . now()->format('F d, Y') . '</p>
                
                <h2>Our Mission</h2>
                <p>We are dedicated to providing exceptional service and innovative solutions to our clients. Our mission is to deliver quality products and services that exceed expectations while maintaining the highest standards of integrity and professionalism.</p>
                
                <h2>Who We Are</h2>
                <p>Founded with a vision to transform the industry, we have grown into a trusted partner for businesses and individuals alike. Our team of experienced professionals is committed to excellence in everything we do.</p>
                
                <h2>Our Values</h2>
                <ul>
                    <li><strong>Integrity:</strong> We conduct our business with honesty and transparency</li>
                    <li><strong>Innovation:</strong> We continuously seek new and better ways to serve our clients</li>
                    <li><strong>Excellence:</strong> We strive for the highest quality in all our endeavors</li>
                    <li><strong>Customer Focus:</strong> Our clients\' success is our success</li>
                    <li><strong>Teamwork:</strong> We believe in the power of collaboration</li>
                </ul>
                
                <h2>Our Team</h2>
                <p>Our diverse team brings together expertise from various fields, creating a dynamic environment where creativity and innovation thrive. Each member contributes unique skills and perspectives that help us deliver exceptional results.</p>
                
                <h2>What We Do</h2>
                <p>We specialize in providing comprehensive solutions tailored to meet the specific needs of our clients. Our services include:</p>
                <ul>
                    <li>Consulting and advisory services</li>
                    <li>Custom solutions development</li>
                    <li>Ongoing support and maintenance</li>
                    <li>Training and knowledge transfer</li>
                </ul>
                
                <h2>Our Commitment</h2>
                <p>We are committed to building long-term relationships with our clients based on trust, reliability, and mutual respect. Your satisfaction is our priority, and we work tirelessly to ensure that every interaction with us is positive and productive.</p>
                
                <h2>Contact Us</h2>
                <p>We\'d love to hear from you! If you have any questions about our company, services, or would like to discuss how we can help you, please don\'t hesitate to reach out to us at info@company.com or through our contact page.</p>
            ',
        ]);

        // Login
        Page::create([
            'user_id' => $adminUser->id,
            'page_type' => 'login',
            'page_title' => 'Login',
            'page_content' => '
                <h1>Login</h1>
                <p><strong>Last updated:</strong> ' . now()->format('F d, Y') . '</p>
                
                <h2>Welcome Back</h2>
                <p>Please sign in to your account to access your dashboard and manage your account settings.</p>
                
                <h2>How to Login</h2>
                <p>To access your account, follow these simple steps:</p>
                <ol>
                    <li>Navigate to the login page</li>
                    <li>Enter your registered email address</li>
                    <li>Enter your password</li>
                    <li>Click the "Sign In" button</li>
                </ol>
                
                <h2>Forgot Password?</h2>
                <p>If you\'ve forgotten your password, you can reset it by clicking the "Forgot Password?" link on the login page. You will receive an email with instructions on how to create a new password.</p>
                
                <h2>Account Security</h2>
                <p>We take the security of your account seriously. Here are some tips to keep your account secure:</p>
                <ul>
                    <li>Use a strong, unique password</li>
                    <li>Never share your login credentials with anyone</li>
                    <li>Log out when using a shared or public computer</li>
                    <li>Enable two-factor authentication if available</li>
                    <li>Contact support immediately if you suspect unauthorized access</li>
                </ul>
                
                <h2>Need Help?</h2>
                <p>If you\'re experiencing issues logging in or have questions about your account, please contact our support team:</p>
                <ul>
                    <li><strong>Email:</strong> support@company.com</li>
                    <li><strong>Phone:</strong> 1-800-SUPPORT</li>
                    <li><strong>Hours:</strong> Monday - Friday, 9 AM - 6 PM EST</li>
                </ul>
                
                <h2>New User?</h2>
                <p>Don\'t have an account yet? Contact your administrator to create an account, or use the registration link if available on the login page.</p>
            ',
        ]);

        // Terms & Conditions
        Page::create([
            'user_id' => $adminUser->id,
            'page_type' => 'terms_conditions',
            'page_title' => 'Terms & Conditions',
            'page_content' => '
                <h1>Terms & Conditions</h1>
                <p><strong>Last updated:</strong> ' . now()->format('F d, Y') . '</p>
                
                <h2>Acceptance of Terms</h2>
                <p>By accessing and using this service, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.</p>
                
                <h2>Use License</h2>
                <p>Permission is granted to temporarily download one copy of the materials on our website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
                <ul>
                    <li>Modify or copy the materials</li>
                    <li>Use the materials for any commercial purpose or for any public display</li>
                    <li>Attempt to reverse engineer any software contained on the website</li>
                    <li>Remove any copyright or other proprietary notations from the materials</li>
                </ul>
                
                <h2>Disclaimer</h2>
                <p>The materials on our website are provided on an \'as is\' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
                
                <h2>Limitations</h2>
                <p>In no event shall our company or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on our website, even if we or our authorized representative has been notified orally or in writing of the possibility of such damage.</p>
                
                <h2>Accuracy of Materials</h2>
                <p>The materials appearing on our website could include technical, typographical, or photographic errors. We do not warrant that any of the materials on its website are accurate, complete, or current. We may make changes to the materials contained on its website at any time without notice.</p>
                
                <h2>Links</h2>
                <p>We have not reviewed all of the sites linked to our website and are not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by us of the site. Use of any such linked website is at the user\'s own risk.</p>
                
                <h2>Modifications</h2>
                <p>We may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.</p>
                
                <h2>Governing Law</h2>
                <p>These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction in which our company is registered and you irrevocably submit to the exclusive jurisdiction of the courts in that state or location.</p>
                
                <h2>Contact Information</h2>
                <p>If you have any questions about these Terms & Conditions, please contact us at legal@company.com or write to us at our registered address.</p>
            ',
        ]);

        // Support
        Page::create([
            'user_id' => $adminUser->id,
            'page_type' => 'support',
            'page_title' => 'Support',
            'page_content' => '
                <h1>Support Center</h1>
                <p><strong>Last updated:</strong> ' . now()->format('F d, Y') . '</p>
                
                <h2>Getting Help</h2>
                <p>We\'re here to help you with any questions or issues you may have. Our support team is available to assist you with technical problems, account issues, and general inquiries.</p>
                
                <h2>Contact Information</h2>
                <p><strong>Email:</strong> support@company.com<br>
                <strong>Phone:</strong> 1-800-SUPPORT<br>
                <strong>Hours:</strong> Monday - Friday, 9 AM - 6 PM EST</p>
                
                <h2>Frequently Asked Questions</h2>
                <p>Find answers to common questions in our FAQ section. If you don\'t find what you\'re looking for, please don\'t hesitate to contact us directly.</p>
                
                <h2>Technical Support</h2>
                <p>For technical issues, please provide detailed information about your problem, including:</p>
                <ul>
                    <li>Steps to reproduce the issue</li>
                    <li>Error messages (if any)</li>
                    <li>Browser and operating system information</li>
                    <li>Screenshots or screen recordings</li>
                </ul>
                
                <h2>Account Support</h2>
                <p>Need help with your account? We can assist with:</p>
                <ul>
                    <li>Password resets</li>
                    <li>Account verification</li>
                    <li>Billing questions</li>
                    <li>Subscription changes</li>
                </ul>
                
                <h2>Response Times</h2>
                <p>We aim to respond to all support requests within 24 hours during business days. For urgent issues, please call our support line directly.</p>
            ',
        ]);

        $this->command->info('Privacy policy, About Us, Login, Terms & Conditions, and Support pages seeded successfully.');
    }
}
