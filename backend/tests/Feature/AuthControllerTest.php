<?php

namespace Tests\Feature;

use App\Mail\PasswordResetOtpMailable;
use App\Models\PasswordResetOtp;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class AuthControllerTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Helper: create a tenant + user pair for use in tests.
     */
    private function createUser(array $overrides = []): User
    {
        $tenant = Tenant::create([
            'name'  => 'Test Business',
            'email' => 'business@example.com',
        ]);

        return User::create(array_merge([
            'tenant_id' => $tenant->id,
            'name'      => 'Test User',
            'email'     => 'test@example.com',
            'username'  => 'testuser',
            'password'  => Hash::make('Password1!'),
        ], $overrides));
    }

    // ── REGISTRATION TESTS ──────────────────────────────────────────

    /** Test 1: Register with valid username → 201, username stored lowercase */
    public function test_register_with_valid_username_returns_201_and_stores_lowercase(): void
    {
        $payload = [
            'name'                  => 'Alice Smith',
            'email'                 => 'alice@example.com',
            'username'              => 'Alice_Smith',
            'password'              => 'Password1!',
            'password_confirmation' => 'Password1!',
            'business_name'         => 'Alice Shop',
        ];

        $response = $this->postJson('/api/register', $payload);

        $response->assertStatus(201)
                 ->assertJsonPath('success', true);

        $this->assertDatabaseHas('users', [
            'email'    => 'alice@example.com',
            'username' => 'alice_smith',  // normalized to lowercase
        ]);
    }

    /** Test 2: Register without username → 422 with errors.username */
    public function test_register_without_username_returns_422(): void
    {
        $payload = [
            'name'                  => 'Bob Jones',
            'email'                 => 'bob@example.com',
            'password'              => 'Password1!',
            'password_confirmation' => 'Password1!',
            'business_name'         => 'Bob Shop',
            // username intentionally omitted
        ];

        $this->postJson('/api/register', $payload)
             ->assertStatus(422)
             ->assertJsonValidationErrors(['username']);
    }

    /** Test 3: Register with username too short (< 3 chars) → 422 */
    public function test_register_with_short_username_returns_422(): void
    {
        $payload = [
            'name'                  => 'Carol Lee',
            'email'                 => 'carol@example.com',
            'username'              => 'ab',
            'password'              => 'Password1!',
            'password_confirmation' => 'Password1!',
            'business_name'         => 'Carol Shop',
        ];

        $this->postJson('/api/register', $payload)
             ->assertStatus(422)
             ->assertJsonValidationErrors(['username']);
    }

    /** Test 4: Register with invalid characters (spaces, special chars) → 422 */
    public function test_register_with_invalid_username_characters_returns_422(): void
    {
        foreach (['user name', 'user@name', 'user-name', 'user.name'] as $bad) {
            $payload = [
                'name'                  => 'Test User',
                'email'                 => 'test_' . md5($bad) . '@example.com',
                'username'              => $bad,
                'password'              => 'Password1!',
                'password_confirmation' => 'Password1!',
                'business_name'         => 'Shop',
            ];

            $this->postJson('/api/register', $payload)
                 ->assertStatus(422)
                 ->assertJsonValidationErrors(['username']);
        }
    }

    /** Test 5: Register with duplicate username (case-insensitive) → 422 */
    public function test_register_with_duplicate_username_returns_422(): void
    {
        $this->createUser(['username' => 'duplicateuser', 'email' => 'first@example.com']);

        $payload = [
            'name'                  => 'Second User',
            'email'                 => 'second@example.com',
            'username'              => 'DuplicateUser',   // same after normalization
            'password'              => 'Password1!',
            'password_confirmation' => 'Password1!',
            'business_name'         => 'Second Shop',
        ];

        // Controller normalizes to lowercase before validation, so the unique
        // check on 'duplicateuser' fires correctly.
        $this->postJson('/api/register', $payload)
             ->assertStatus(422)
             ->assertJsonValidationErrors(['username']);
    }

    // ── LOGIN TESTS ─────────────────────────────────────────────────

    /** Test 6: Login with email → 200, token returned */
    public function test_login_with_email_returns_200_and_token(): void
    {
        $this->createUser(['email' => 'user@example.com', 'username' => 'myuser']);

        $this->postJson('/api/login', [
                'login'    => 'user@example.com',
                'password' => 'Password1!',
            ])
            ->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['token']);
    }

    /** Test 7: Login with username → 200, token returned */
    public function test_login_with_username_returns_200_and_token(): void
    {
        $this->createUser(['email' => 'user2@example.com', 'username' => 'myuser2']);

        $this->postJson('/api/login', [
                'login'    => 'myuser2',
                'password' => 'Password1!',
            ])
            ->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['token']);
    }

    /** Test 8: Login with mixed-case username → 200 (normalized) */
    public function test_login_with_mixed_case_username_returns_200(): void
    {
        $this->createUser(['email' => 'user3@example.com', 'username' => 'myuser3']);

        $this->postJson('/api/login', [
                'login'    => 'MyUser3',
                'password' => 'Password1!',
            ])
            ->assertStatus(200)
            ->assertJsonPath('success', true);
    }

    /** Test 9: Login with wrong username → 401 */
    public function test_login_with_wrong_username_returns_401(): void
    {
        $this->createUser(['email' => 'user4@example.com', 'username' => 'realuser']);

        $this->postJson('/api/login', [
                'login'    => 'wronguser',
                'password' => 'Password1!',
            ])
            ->assertStatus(401)
            ->assertJsonPath('success', false);
    }

    /** Test 10: Login with wrong password → 401 */
    public function test_login_with_wrong_password_returns_401(): void
    {
        $this->createUser(['email' => 'user5@example.com', 'username' => 'user5']);

        $this->postJson('/api/login', [
                'login'    => 'user5@example.com',
                'password' => 'WrongPassword1!',
            ])
            ->assertStatus(401)
            ->assertJsonPath('success', false);
    }

    /** Test 11: Existing user with NULL username can log in with email → 200 */
    public function test_existing_user_with_null_username_can_login_with_email(): void
    {
        $this->createUser([
            'email'    => 'legacy@example.com',
            'username' => null,   // existing account without a username
        ]);

        $this->postJson('/api/login', [
                'login'    => 'legacy@example.com',
                'password' => 'Password1!',
            ])
            ->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['token']);
    }

    /** Test 12: Registration rejects malicious base64 mime types (e.g., PHP executable) */
    public function test_register_rejects_malicious_base64_mime_type_for_logo(): void
    {
        $payload = [
            'name'                  => 'Hacker Bob',
            'email'                 => 'bob@example.com',
            'username'              => 'hacker_bob',
            'password'              => 'Password1!',
            'password_confirmation' => 'Password1!',
            'business_name'         => 'Exploit Corp',
            'logo'                  => 'data:image/php;base64,PD9waHAgcGhwaW5mbygpOyA/Pg==',
        ];

        $response = $this->postJson('/api/register', $payload);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['logo']);
    }

    /** Test 13: Registration accepts valid base64 image and saves with safe extension */
    public function test_register_accepts_valid_base64_image_for_logo_and_saves_with_safe_extension(): void
    {
        \Illuminate\Support\Facades\Storage::fake('public');

        // 1x1 transparent PNG pixel in base64
        $pngBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

        $payload = [
            'name'                  => 'Valid User',
            'email'                 => 'valid@example.com',
            'username'              => 'valid_user',
            'password'              => 'Password1!',
            'password_confirmation' => 'Password1!',
            'business_name'         => 'Valid Business',
            'logo'                  => $pngBase64,
        ];

        $response = $this->postJson('/api/register', $payload);

        $response->assertStatus(201)
                 ->assertJsonPath('success', true);

        $tenant = Tenant::where('name', 'Valid Business')->first();
        $this->assertNotNull($tenant);
        $this->assertNotNull($tenant->logo_path);
        $this->assertStringEndsWith('.png', $tenant->logo_path);
        $this->assertStringStartsNotWith('logos/..', $tenant->logo_path);
        \Illuminate\Support\Facades\Storage::disk('public')->assertExists($tenant->logo_path);
    }

    // ── FORGOT PASSWORD (MULTI-STEP OTP & TENANT ISOLATION) TESTS ──

    /** Test 14: Full 3-step owner forgot password flow (send OTP -> verify OTP -> reset password) */
    public function test_owner_can_complete_three_step_forgot_password_flow(): void
    {
        Mail::fake();

        $owner = $this->createUser([
            'email'    => 'owner@acmeretail.com',
            'username' => 'acme_owner',
            'password' => Hash::make('OldPassword1!'),
        ]);

        // Step 1: Send OTP
        $sendRes = $this->postJson('/api/forgot-password/send-otp', [
            'email' => 'owner@acmeretail.com',
        ]);

        $sendRes->assertStatus(200)
                ->assertJsonPath('success', true)
                ->assertJsonPath('tenant_id', $owner->tenant_id);

        $capturedOtp = null;
        Mail::assertSent(PasswordResetOtpMailable::class, function (PasswordResetOtpMailable $mail) use (&$capturedOtp) {
            $capturedOtp = $mail->otp;
            return $mail->hasTo('owner@acmeretail.com');
        });
        $this->assertNotNull($capturedOtp);

        // Step 2: Verify OTP
        $verifyRes = $this->postJson('/api/forgot-password/verify-otp', [
            'email'     => 'owner@acmeretail.com',
            'otp'       => $capturedOtp,
            'tenant_id' => $owner->tenant_id,
        ]);

        $verifyRes->assertStatus(200)
                  ->assertJsonPath('success', true)
                  ->assertJsonStructure(['reset_token']);

        $resetToken = $verifyRes->json('reset_token');

        // Step 3: Reset Password
        $resetRes = $this->postJson('/api/forgot-password/reset-password', [
            'email'                 => 'owner@acmeretail.com',
            'otp'                   => $capturedOtp,
            'reset_token'           => $resetToken,
            'tenant_id'             => $owner->tenant_id,
            'password'              => 'NewPassword1!',
            'password_confirmation' => 'NewPassword1!',
        ]);

        $resetRes->assertStatus(200)
                 ->assertJsonPath('success', true);

        // Verify login works with the new password
        $this->postJson('/api/login', [
            'login'    => 'owner@acmeretail.com',
            'password' => 'NewPassword1!',
        ])->assertStatus(200);
    }

    /** Test 15: Wrong OTP is rejected in step 2 and restricts access to step 3 password reset */
    public function test_wrong_otp_is_rejected_and_blocks_password_reset(): void
    {
        Mail::fake();

        $owner = $this->createUser([
            'email'    => 'owner2@example.com',
            'username' => 'owner2',
            'password' => Hash::make('OldPassword1!'),
        ]);

        $this->postJson('/api/forgot-password/send-otp', [
            'email' => 'owner2@example.com',
        ])->assertStatus(200);

        // Wrong OTP in Step 2 -> 422
        $this->postJson('/api/forgot-password/verify-otp', [
            'email'     => 'owner2@example.com',
            'otp'       => '000000',
            'tenant_id' => $owner->tenant_id,
        ])->assertStatus(422)
          ->assertJsonPath('success', false);

        // Attempting Step 3 without verified OTP -> 403
        $this->postJson('/api/forgot-password/reset-password', [
            'email'                 => 'owner2@example.com',
            'otp'                   => '000000',
            'tenant_id'             => $owner->tenant_id,
            'password'              => 'HackedPass1!',
            'password_confirmation' => 'HackedPass1!',
        ])->assertStatus(403)
          ->assertJsonPath('success', false);

        $owner->refresh();
        $this->assertTrue(Hash::check('OldPassword1!', $owner->password));
    }

    /** Test 16: Tenant data isolation — OTP sent to Tenant A cannot be used by Tenant B */
    public function test_otp_sent_to_one_tenant_cannot_be_used_by_another_tenant(): void
    {
        Mail::fake();

        $tenantA = Tenant::create(['name' => 'Tenant Alpha', 'email' => 'alpha@example.com']);
        $ownerA = User::create([
            'tenant_id' => $tenantA->id,
            'name'      => 'Alpha Owner',
            'email'     => 'alpha@example.com',
            'username'  => 'alpha_owner',
            'password'  => Hash::make('AlphaPass1!'),
        ]);

        $tenantB = Tenant::create(['name' => 'Tenant Beta', 'email' => 'beta@example.com']);
        $ownerB = User::create([
            'tenant_id' => $tenantB->id,
            'name'      => 'Beta Owner',
            'email'     => 'beta@example.com',
            'username'  => 'beta_owner',
            'password'  => Hash::make('BetaPass1!'),
        ]);

        // Request OTP for Tenant A
        $this->postJson('/api/forgot-password/send-otp', [
            'email' => 'alpha@example.com',
        ])->assertStatus(200);

        $tenantAOtp = null;
        Mail::assertSent(PasswordResetOtpMailable::class, function (PasswordResetOtpMailable $mail) use (&$tenantAOtp) {
            if ($mail->hasTo('alpha@example.com')) {
                $tenantAOtp = $mail->otp;
                return true;
            }
            return false;
        });
        $this->assertNotNull($tenantAOtp);

        // Also request OTP for Tenant B so Tenant B has an active OTP session
        $this->postJson('/api/forgot-password/send-otp', [
            'email' => 'beta@example.com',
        ])->assertStatus(200);

        // 1. Tenant B tries to verify using Tenant A's OTP -> must fail (422)
        $this->postJson('/api/forgot-password/verify-otp', [
            'email'     => 'beta@example.com',
            'otp'       => $tenantAOtp,
            'tenant_id' => $tenantB->id,
        ])->assertStatus(422)
          ->assertJsonPath('success', false);

        // 2. Passing Tenant A's tenant_id with Tenant B's email -> must fail (403)
        $this->postJson('/api/forgot-password/verify-otp', [
            'email'     => 'beta@example.com',
            'otp'       => $tenantAOtp,
            'tenant_id' => $tenantA->id,
        ])->assertStatus(403)
          ->assertJsonPath('success', false);

        // 3. Even after Tenant A verifies its own OTP and gets a reset_token,
        //    that OTP + reset_token cannot be used to reset Tenant B's password
        $verifyARes = $this->postJson('/api/forgot-password/verify-otp', [
            'email'     => 'alpha@example.com',
            'otp'       => $tenantAOtp,
            'tenant_id' => $tenantA->id,
        ])->assertStatus(200);

        $tenantAResetToken = $verifyARes->json('reset_token');

        $this->postJson('/api/forgot-password/reset-password', [
            'email'                 => 'beta@example.com',
            'otp'                   => $tenantAOtp,
            'reset_token'           => $tenantAResetToken,
            'password'              => 'CrossTenantHack1!',
            'password_confirmation' => 'CrossTenantHack1!',
        ])->assertStatus(403)
          ->assertJsonPath('success', false);

        $ownerB->refresh();
        $this->assertTrue(Hash::check('BetaPass1!', $ownerB->password));
    }

    /** Test 17: Non-owner staff user cannot use the owner forgot password OTP endpoint */
    public function test_non_owner_staff_user_cannot_request_owner_forgot_password_otp(): void
    {
        Mail::fake();

        $owner = $this->createUser([
            'email'    => 'boss@shop.com',
            'username' => 'boss_user',
        ]);

        $cashierRole = Role::create([
            'name'       => 'cashier',
            'is_default' => true,
        ]);

        $staff = User::create([
            'tenant_id'  => $owner->tenant_id,
            'name'       => 'Staff Cashier',
            'email'      => 'cashier@shop.com',
            'username'   => 'cashier_user',
            'password'   => Hash::make('CashierPass1!'),
            'created_by' => $owner->id,
        ]);
        $staff->roles()->attach($cashierRole->id);

        $this->postJson('/api/forgot-password/send-otp', [
            'email' => 'cashier@shop.com',
        ])->assertStatus(403)
          ->assertJsonPath('success', false);

        Mail::assertNothingSent();
    }
}
