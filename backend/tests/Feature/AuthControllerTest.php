<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
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
}
