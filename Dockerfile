# Flynn project container build
#
# This Dockerfile provides a convenient way to build and run Flynn in a
# containerised environment. It installs all dependencies using pnpm,
# builds the TypeScript sources and exposes a sensible default entrypoint
# to launch the server. Users can override the CMD at runtime to
# execute other apps such as the CLI.

FROM node:20-alpine

# Enable corepack and set up pnpm. Corepack will bootstrap pnpm
# automatically when the container is built.
RUN corepack enable && pnpm setup

# Define working directory inside the container
WORKDIR /usr/src/app

# Copy the repository contents into the container
COPY . .

# Install dependencies and build the project. --frozen-lockfile ensures
# that the versions in pnpm-lock.yaml are respected. The recursive build
# compiles all packages defined in the monorepo.
RUN pnpm install --frozen-lockfile && pnpm -r build

# Expose a default port; the actual port can be configured at runtime
EXPOSE 3000

# Start the Flynn server by default. This command can be overridden at
# runtime by specifying a different CMD in the docker run arguments.
CMD ["pnpm", "--filter", "@flynn/server", "start"]