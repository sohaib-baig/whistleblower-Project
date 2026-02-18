<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        // all permissions
        $permissions = [
            'users.manage',
            'users.view',
            'users.create',
            'users.update',
            'users.delete',
            'categories.manage',
            'categories.view',
            'categories.create',
            'categories.update',
            'categories.delete',
            'reporting_links.manage',
            'companies.manage',
            'companies.view',
            'companies.create',
            'companies.update',
            'companies.delete',
            'cases.manage',
            'cases.view',
            'cases.create',
            'cases.update',
            'cases.delete',
            'case_managers.manage',
            'case_managers.view',
            'case_managers.create',
            'case_managers.update',
            'case_managers.delete',
            'questions.manage',
            'questions.view',
            'questions.create',
            'questions.update',
            'questions.delete',
            'news.manage',
            'news.view',
            'news.create',
            'news.update',
            'news.delete',
            'invoices.manage',
            'invoices.view',
            'invoices.create',
            'invoices.update',
            'invoices.delete',
            'roles.manage',
            'roles.view',
            'roles.create',
            'roles.update',
            'roles.delete',
            'permissions.manage',
            'permissions.view',
            'permissions.create',
            'permissions.update',
            'permissions.delete',            
            'notifications.manage',
            'notifications.view',
            'notifications.create',
            'notifications.update',
            'notifications.delete',
            'reports.manage',
            'reports.view',
            'reports.create',
            'reports.update',
            'reports.delete',
            'departments.manage',
            'departments.view',
            'departments.create',
            'departments.update',
            'departments.delete',
            'states.manage',
            'states.view',
            'states.create',
            'states.update',
            'states.delete',
            'severities.manage',
            'severities.view',
            'severities.create',
            'severities.update',
            'severities.delete',
            'privacy_policies.update',
            'terms_conditions.update',
            'support.update',
            'email_templates.manage',
            'email_templates.view',
            'email_templates.create',
            'email_templates.update',
            'email_templates.delete',
            'theme_configuration.manage',
            'theme_configuration.view',
            'theme_configuration.create',
            'theme_configuration.update',
            'theme_configuration.delete',
            'stripe_configuration.manage',
            'stripe_configuration.view',
            'stripe_configuration.create',
            'stripe_configuration.update',
            'stripe_configuration.delete',
            'bank_details.manage',
            'bank_details.view',
            'bank_details.create',
            'bank_details.update',
            'bank_details.delete',
            'basic_configuration.manage',
            'basic_configuration.view',
            'basic_configuration.create',
            'basic_configuration.update',
            'basic_configuration.delete'
        ];
        // create all permissions
        foreach ($permissions as $name) {
            Permission::firstOrCreate(['name' => $name]);
        }
        // admin permissions
        $adminPermissions = $permissions;
        // create admin role (lowercase slug)
        $admin = Role::firstOrCreate(['name' => 'admin']);
        $admin->syncPermissions($adminPermissions);
        
        // media_buyer permissions
        $companyPermissions = [
            'reporting_links.manage',
            'invoices.manage',
            'invoices.view',
            'cases.manage',
            'cases.view',
            'case_managers.manage',
            'case_managers.view',
            'case_managers.create',
            'case_managers.update',
            'case_managers.delete',
            'questions.manage',
            'questions.view',
            'questions.create',
            'questions.update',
            'questions.delete',
            'news.manage',
            'news.view',
            'news.create',
            'news.update',
            'news.delete',
            'departments.manage',
            'departments.view',
            'departments.create',
            'departments.update',
            'departments.delete',
            'states.manage',
            'states.view',
            'states.create',
            'states.update',
            'states.delete',
            'severities.manage',
            'severities.view',
            'severities.create',
            'severities.update',
            'severities.delete',
        ];
        // create company role (lowercase slug)
        $company = Role::firstOrCreate(['name' => 'company']);
        $company->syncPermissions($companyPermissions);

        // caseManager permissions
        $caseManagerPermissions = [
            'cases.view',
            'case_managers.view',
            'case_managers.create',
            'case_managers.update',
            'reporting_links.manage',            
        ];
        // create caseManager role (lowercase slug)
        $caseManager = Role::firstOrCreate(['name' => 'case_manager']);
        $caseManager->syncPermissions($caseManagerPermissions);
    }
}