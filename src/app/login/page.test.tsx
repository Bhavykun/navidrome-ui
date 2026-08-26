import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const router = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));

import LoginPage from "@/app/login/page";

describe("login page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("redirects after valid credentials", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, username: "listener" }),
    } as Response);

    const user = userEvent.setup();
    render(<LoginPage />);
    await user.type(screen.getByLabelText("Server URL"), "https://music.example.com");
    await user.type(screen.getByLabelText("Username"), "listener");
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/"));
    expect(router.refresh).toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledWith("/api/auth/login", expect.objectContaining({ method: "POST" }));
  });

  it("shows an error for invalid credentials", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Navidrome rejected these credentials" }),
    } as Response);

    const user = userEvent.setup();
    render(<LoginPage />);
    await user.type(screen.getByLabelText("Server URL"), "https://music.example.com");
    await user.type(screen.getByLabelText("Username"), "listener");
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Navidrome rejected these credentials");
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    const password = screen.getByLabelText("Password");
    expect(password).toHaveAttribute("type", "password");
    await user.click(screen.getByTitle("Show password"));
    expect(password).toHaveAttribute("type", "text");
    expect(screen.getByTitle("Hide password")).toBeInTheDocument();
  });
});
